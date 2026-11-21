<!-- Website hand-over notes: copied from the Perplexity Computer hand-over (2026-11-20). -->
<!-- Chart links were removed: they were temporary signed download links. -->
<!-- The website uses public/model/birdquest_model.json, made by scripts/prepare-model.mjs, -->
<!-- which removes the 19 personal (private) locations mentioned below. -->

# BirdQuest 出现预测模型：网站交接说明

这个文件夹包含训练好的模型和网站可直接调用的预测代码。前端只需要 `birdquest_model.json` 和 `birdquest-predictor.js` 两个文件，不需要安装任何机器学习库，也不需要 API key。

## 文件说明

| 文件 | 用途 |
|---|---|
| `birdquest_model.json` | 模型本体（0.9 MB）：特征顺序、标准化参数、60 个鸟种、117 个地点、模型权重、天气换算与月平均气候值 |
| `birdquest-predictor.js` | 浏览器 / Node.js 版预测代码（ES module，无依赖），两种模式都已实现 |
| `birdquest_predictor.py` | Python 版，逻辑与 JS 完全相同（只需要 numpy），适合 Flask / FastAPI 后端 |
| `examples/` | 两种模式的真实输出示例（2026-11-22 的预报天气） |
| `evaluation/` | 评估报告、每个鸟种的指标 CSV 和图表 |
| `training/` | 复现训练的脚本 |

JS 版和 Python 版在相同输入下的输出完全一致（已逐项比对，最大差值为 0）。在 Node 中，16 天 × 98 个热点 × 8 个时段的推荐计算约需 1 秒；单个地点的鸟种预测约需 10 毫秒。

## 最小用法（前端）

```html
<script type="module">
import { BirdQuestPredictor } from "./birdquest-predictor.js";
const model = await (await fetch("./birdquest_model.json")).json();
const bq = new BirdQuestPredictor(model);   // 自动使用香港今天的日期

// 模式 1：地点 + 日期 + 时间段 → 可能出现的鸟种
const r1 = await bq.predictSpecies({
  location: "Mai Po",            // 热点名称（中英文都可，支持部分匹配）、locality_id，或 [lat, lon]
  date: "2026-11-22",
  start: "07:00", end: "10:00",
  targetSpecies: "Pied Avocet",  // 可选
  topK: 20
});

// 模式 2：目标鸟种 + 日期（一天、多天列表或区间）→ 推荐地点和时间
const r2 = await bq.recommend({
  species: "Pied Avocet",
  dates: { from: "2026-11-21", to: "2026-11-23" },   // 或 "2026-11-21"、["2026-11-21", "2026-11-28"]
  topN: 10
  // 可选：startTimes: ["06:30","07:30",...], durationMin: 120
});
</script>
```

Python 后端：

```python
from birdquest_predictor import BirdQuestPredictor
bq = BirdQuestPredictor("birdquest_model.json")
bq.predict_species("Mai Po", "2026-11-22", "07:00", "10:00", target_species="Pied Avocet")
bq.recommend("Pied Avocet", ("2026-11-21", "2026-11-23"), top_n=10)
```

## 模型输入：系统自动获取 + 用户输入

| 来源 | 内容 | 处理方式 |
|---|---|---|
| 用户输入 | 地点、日期、时间段（模式 1）；目标鸟种、日期（模式 2） | 时间段的开始时间和长度会作为一次观鸟的开始时间和时长（5–300 分钟） |
| 自动计算 | 日序周期编码、时刻周期编码、日出日落、日长、距日出 / 日落的分钟数、是否白天 | 与训练时用同一套 NOAA 公式 |
| 自动获取 | 当天天气：平均气温、较前一天的气温变化、湿度、雨量、3 天累计雨量、气压变化、云量、日照、风速、风向 | 调用 [Open-Meteo](https://open-meteo.com/) 预报 API（免费、无需 key、允许浏览器直接调用），可查过去 3 天和未来 16 天，再用 `weather_calibration_open_meteo_to_hko` 线性换算到训练时的天文台尺度 |
| 固定默认值 | 观鸟方式 = Traveling，距离 1 km，观察者 1 人 | 在 `model.defaults` 中，可修改 |

超过 16 天的日期，或 Open-Meteo 无法访问时，会自动改用该月的平均天气（`weather_climatology_by_month`），并把可信度降一级。如果你们要改用天文台 API，只需要传入同样字段的原始数值：`predictSpecies({..., weather: {...}})` 或 `recommend({..., weatherByDate: {"2026-11-22": {...}}})`。

## 输出字段

### 模式 1 `predictSpecies` → `mode: "species_at_location"`

| 字段 | 含义 |
|---|---|
| `location` | 实际使用的热点（`distance_to_input_km` = 输入坐标到该热点的距离） |
| `weather_used` | 使用的天气数值，以及 `source`、`lead_days` |
| `expected_species_count` | 预计能记录到的鸟种数（60 个鸟种的概率之和） |
| `ranked_species[]` | 按概率排序的鸟种：`probability`、`best_start`（时间段内最好的开始时间）、`label`、`level`、`reasons` |
| `target_species` | 填写了目标鸟种时才返回：其概率、排名和可信度 |
| `prediction_map[]` | 98 个公开热点在同一时间的值：有目标鸟种时是该鸟种的概率，否则是预计鸟种数；附 `lat`、`lon`，可直接画在 Leaflet 或 Mapbox 上 |

### 模式 2 `recommend` → `mode: "recommend_for_species"`

| 字段 | 含义 |
|---|---|
| `recommendations[]` | 推荐列表，每个（地点，日期）只保留最好的时段：`date`、`start`、`end`、`location`、`probability`、`label`、`level`、`reasons`、`ranking_score` |
| `best_per_date[]` | 每一天最好的地点和时间（适合多天比较） |
| `prediction_map[]` | 每个热点在所选日期中的最高概率，以及对应的 `best_date` 和 `best_start` |
| `decision_threshold` | 该鸟种的判定阈值（高于它为 `likely`） |

排序依据是 `ranking_score` = 概率 − 可信度扣分（high 扣 0，medium 扣 0.05，low 扣 0.10），避免把数据不足的地点排在前面。

## 可信度怎么显示

- `probability`：已校准。测试集中预测 0.8–1.0 时，实际记录到的比例约 88%。建议直接显示为百分比，例如「看到的机会 85%」。
- `label`：`likely` / `possible` / `unlikely`，可以用颜色区分。
- `level`：`high` / `medium` / `low`，表示这个数字有多可靠。`reasons` 会说明降级原因（例如「天气为长期预报或月平均」），可以放在提示框里。

## 需要知道的限制

- 模型只覆盖 60 个最常见的鸟种（列表见 `model.species`，或 `matrix_species_columns.csv`）。输入其他鸟种（例如黑脸琵鹭）时会抛出错误，并附上可用鸟种列表；网站可以用下拉菜单限制选择。
- 只推荐 98 个公开热点。另外 19 个是个人地点（例如阳台、住宅），为保护隐私，不在地图和推荐中显示。
- 输入任意坐标时，会使用最近的热点；距离超过 3 km 时，可信度会降级。
- 鸟种没有中文名，`species` 中只有英文名和学名。如需显示中文，请加一张对照表（例如参考香港观鸟会的名录）。
- 模型没有使用潮汐数据，米埔 / 后海湾涉禽的最佳时间还需要结合潮汐表判断。

## 如何重新训练

在 `training/` 中依次运行：

```bash
pip install pandas numpy scipy scikit-learn matplotlib
python recover_dates.py     # 由 num_doy_sin/cos 反推每份清单的日期 → data/row_dates.csv
python recover_params.py    # 反推每个数值特征的标准化参数和地点 → data/params_partial.json, data/row_meta.csv
python train_final.py       # 训练、评估、导出 → output/（约 5 分钟）
```

脚本会读取 `../../raw_data/` 中的三个 CSV，以及 `training/data/` 中的天文台日天气表和 Open-Meteo 历史天气。

之所以要「反推」：训练表只保留了标准化后的数值，没有原始日期和标准化参数，而网站必须把用户输入的原始值换算成同一尺度。反推结果已验证：气温、湿度、日长与天文台数据的相关系数为 1.000；随机抽取 255 份清单，用网站流程从原始输入重建特征后，与训练表的最大误差为 0.02 个标准差（来自天文台日出时间 1 分钟的差异）。如果以后重新做预处理，建议直接保存每个特征的 mean / std。
