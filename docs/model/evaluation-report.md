<!-- Model evaluation report: copied from the Perplexity Computer hand-over (2026-11-20). -->
<!-- Chart links were removed: they were temporary signed download links. -->
<!-- The website uses public/model/birdquest_model.json, made by scripts/prepare-model.mjs, -->
<!-- which removes the 19 personal (private) locations mentioned below. -->

# BirdQuest 出现预测模型：训练与评估报告

数据：`bird_occurrence_training.csv`（9,847 份香港 eBird 完整清单，2025-10-01 至 2026-09-30，60 个鸟种，149 个输入特征）。训练平台：Perplexity Computer（Python / scikit-learn），模型导出为 JSON，可直接在网站的 JavaScript 或 Python 后端运行。

## 结论摘要

- 最终模型是两个模型的平均：每个鸟种一个逻辑回归，加一个同时输出 60 个鸟种的小型神经网络（MLP，两层隐藏层 256 和 128）。在验证集上，它比 LightGBM、单独的逻辑回归、单独的 MLP 和 kNN 都好。
- 测试集上 60 个鸟种的平均 F1 为 0.718，月度频率基线为 0.433；60 个鸟种全部高于基线，F1 平均提高 0.285（最少 0.015，最多 0.602）。
- 平均 ROC-AUC 为 0.898，基线为 0.590。月度频率基线只知道「几月」，不知道「在哪里」，所以几乎无法区分同一个月里的不同地点。
- 模型输出的概率经过校准：预测 0.8–1.0 的清单，实际记录到的比例约 0.88；预测 0.4–0.6 时约 0.53。所以网站可以把概率直接作为「看到的可能性」。

## 1. 数据与切分

| 集合 | 清单数 | 规则 |
|---|---|---|
| train | 5,921 | 每月 1–18 日 |
| validation | 1,869 | 每月 19–24 日（用于选模型、调参和确定每个鸟种的判定阈值） |
| test | 2,057 | 每月 25 日及以后（只用于最终评估） |

训练文件已经标准化，没有原始日期列。我先用 `num_doy_sin` / `num_doy_cos` 反推每份清单的日期，再与天文台每日天气表核对：气温、湿度和日长的相关系数都是 1.000，说明日期完全正确。由此确认 `split` 列使用的是「月内切分」（`split_within_month`）。

## 2. 比较的模型

| 模型 | 说明 |
|---|---|
| 月度频率基线（提案要求） | 某鸟种在训练集该月份的报告率，例如 12 月有 40% 的清单记录到，就预测 0.40 |
| 地点 × 月份基线（额外参考） | 该地点该月份的报告率，样本少时向月度频率收缩 |
| kNN（k = 30，提案中的模型） | 距离加权的 k 近邻 |
| BirdQuest 集成模型（最终） | 逻辑回归（C = 1）与 MLP（256-128，alpha = 0.01，early stopping）的概率平均 |

验证集平均 ROC-AUC：月度基线 0.603，地点 × 月份基线 0.858，kNN 0.826–0.829，逻辑回归 0.894，MLP 0.896，LightGBM 0.898，逻辑回归 + MLP 0.899。逻辑回归 + MLP + LightGBM 的三模型平均能达到 0.902，但 LightGBM 无法用简单的 JSON 在浏览器里运行，提升又很小，所以没有采用。

每个鸟种的判定阈值（概率高于阈值就算「预测出现」）都在验证集上按 F1 最大化选取，基线也用同样方法选阈值，以保证比较公平。

## 3. 测试集总体结果

| 模型 | Precision（宏平均） | Recall（宏平均） | F1（宏平均） | ROC-AUC | Average precision | Brier（越低越好） | Micro F1 |
|---|---|---|---|---|---|---|---|
| **BirdQuest 集成模型** | **0.650** | **0.813** | **0.718** | **0.898** | **0.747** | **0.100** | **0.740** |
| kNN（k = 30） | 0.555 | 0.727 | 0.623 | 0.825 | 0.633 | 0.128 | 0.662 |
| 地点 × 月份基线 | 0.614 | 0.773 | 0.680 | 0.850 | 0.671 | 0.119 | 0.704 |
| 月度频率基线 | 0.307 | 0.807 | 0.433 | 0.590 | 0.322 | 0.170 | 0.487 |

*（图表「总体比较」见原交接文件夹的 evaluation/，此处不附链接）*

月度频率基线的 recall 看起来不低，是因为它只能按月份判断：只要某鸟种在这个月常见，它就对全港所有地点都预测「出现」，因此 precision 很低。集成模型在 60 个鸟种上的 precision 都高于基线，同时平均 recall 也更高（0.813 对 0.807）。

*（图表「每个鸟种的 F1」见原交接文件夹的 evaluation/，此处不附链接）*

*（图表「校准曲线」见原交接文件夹的 evaluation/，此处不附链接）*

### 时间顺序切分检验（敏感性分析）

提案原本写的是按时间顺序切分 60/20/20。我也按这种方式重新训练了一次：训练集为 2025-10-01 至 2026-03-28，验证集为 2026-03-29 至 06-16，测试集为 2026-06-17 至 09-30。

| 模型 | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|
| BirdQuest 集成模型 | 0.530 | 0.730 | 0.596 | 0.877 |
| 地点 × 月份基线 | 0.215 | 0.867 | 0.319 | 0.500 |
| 月度频率基线 | 0.220 | 0.967 | 0.328 | 0.500 |

在这种切分下，测试集只有夏季，而训练集一个夏季月份都没有，两个基线完全没有可用的信息（AUC = 0.5）。集成模型仍能达到 0.877，因为天气、日长、地点等特征可以外推。不过只有一年数据时，这种切分不能代表网站全年的使用情况，所以主要结果采用月内切分。

## 4. 每个鸟种的 Precision、Recall 和混淆矩阵

混淆矩阵按每个鸟种分别计算，每个都是 2 × 2：TP = 预测出现且实际记录到，FP = 预测出现但未记录，FN = 预测不出现但实际记录到，TN = 预测不出现且未记录。下表按测试集出现率从高到低排列；「基线」指月度频率基线。

*（图表「集成模型的混淆矩阵」见原交接文件夹的 evaluation/，此处不附链接）*

*（图表「月度基线的混淆矩阵」见原交接文件夹的 evaluation/，此处不附链接）*

| # | 鸟种 | 测试集出现率 | 阈值 | TP | FP | FN | TN | Precision | Recall | F1 | 基线 Precision | 基线 Recall | 基线 F1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Red-whiskered Bulbul (Pycnonotus jocosus) | 74.8% | 0.50 | 1428 | 312 | 111 | 206 | 0.82 | 0.93 | 0.87 | 0.75 | 1.00 | 0.86 |
| 2 | Spotted Dove (Spilopelia chinensis) | 73.8% | 0.40 | 1466 | 344 | 53 | 194 | 0.81 | 0.97 | 0.88 | 0.74 | 1.00 | 0.85 |
| 3 | Oriental Magpie-Robin (Copsychus saularis) | 58.0% | 0.34 | 1098 | 528 | 95 | 336 | 0.68 | 0.92 | 0.78 | 0.58 | 1.00 | 0.73 |
| 4 | Light-vented Bulbul (Pycnonotus sinensis) | 56.3% | 0.32 | 1060 | 552 | 98 | 347 | 0.66 | 0.92 | 0.77 | 0.56 | 1.00 | 0.72 |
| 5 | Black-collared Starling (Gracupica nigricollis) | 56.2% | 0.34 | 1079 | 324 | 77 | 577 | 0.77 | 0.93 | 0.84 | 0.56 | 1.00 | 0.72 |
| 6 | Black Kite (Milvus migrans) | 54.2% | 0.39 | 946 | 330 | 168 | 613 | 0.74 | 0.85 | 0.79 | 0.54 | 1.00 | 0.70 |
| 7 | Swinhoe's White-eye (Zosterops simplex) | 52.4% | 0.35 | 926 | 482 | 151 | 498 | 0.66 | 0.86 | 0.75 | 0.52 | 1.00 | 0.69 |
| 8 | Eurasian Tree Sparrow (Passer montanus) | 50.3% | 0.42 | 908 | 307 | 126 | 716 | 0.75 | 0.88 | 0.81 | 0.50 | 1.00 | 0.67 |
| 9 | Crested Myna (Acridotheres cristatellus) | 48.2% | 0.43 | 830 | 199 | 162 | 866 | 0.81 | 0.84 | 0.82 | 0.48 | 1.00 | 0.65 |
| 10 | Common Tailorbird (Orthotomus sutorius) | 47.2% | 0.33 | 824 | 509 | 146 | 578 | 0.62 | 0.85 | 0.72 | 0.47 | 1.00 | 0.64 |
| 11 | Little Egret (Egretta garzetta) | 43.4% | 0.34 | 812 | 180 | 81 | 984 | 0.82 | 0.91 | 0.86 | 0.43 | 1.00 | 0.61 |
| 12 | White Wagtail (Motacilla alba) | 40.9% | 0.42 | 671 | 262 | 171 | 953 | 0.72 | 0.80 | 0.76 | 0.46 | 0.79 | 0.58 |
| 13 | Asian Tit (Parus cinereus) | 38.6% | 0.31 | 646 | 517 | 149 | 745 | 0.56 | 0.81 | 0.66 | 0.39 | 0.98 | 0.56 |
| 14 | Large-billed Crow (Corvus macrorhynchos) | 37.0% | 0.29 | 575 | 403 | 187 | 892 | 0.59 | 0.75 | 0.66 | 0.37 | 1.00 | 0.54 |
| 15 | Masked Laughingthrush (Pterorhinus perspicillatus) | 33.3% | 0.27 | 591 | 553 | 94 | 819 | 0.52 | 0.86 | 0.65 | 0.33 | 1.00 | 0.50 |
| 16 | Great Egret (Ardea alba) | 32.9% | 0.27 | 644 | 240 | 32 | 1141 | 0.73 | 0.95 | 0.83 | 0.34 | 0.84 | 0.49 |
| 17 | Asian Koel (Eudynamys scolopaceus) | 30.8% | 0.29 | 487 | 285 | 147 | 1138 | 0.63 | 0.77 | 0.69 | 0.47 | 0.71 | 0.56 |
| 18 | Yellow-browed Warbler (Phylloscopus inornatus) | 30.8% | 0.32 | 503 | 339 | 130 | 1085 | 0.60 | 0.79 | 0.68 | 0.51 | 0.80 | 0.62 |
| 19 | Chinese Pond-Heron (Ardeola bacchus) | 30.3% | 0.43 | 545 | 145 | 79 | 1288 | 0.79 | 0.87 | 0.83 | 0.32 | 0.93 | 0.48 |
| 20 | Barn Swallow (Hirundo rustica) | 29.5% | 0.32 | 513 | 279 | 93 | 1172 | 0.65 | 0.85 | 0.73 | 0.33 | 0.88 | 0.48 |
| 21 | Gray Heron (Ardea cinerea) | 28.6% | 0.31 | 547 | 218 | 42 | 1250 | 0.72 | 0.93 | 0.81 | 0.34 | 0.84 | 0.49 |
| 22 | White-breasted Waterhen (Amaurornis phoenicurus) | 27.8% | 0.27 | 528 | 228 | 44 | 1257 | 0.70 | 0.92 | 0.80 | 0.28 | 1.00 | 0.44 |
| 23 | Greater Coucal (Centropus sinensis) | 26.1% | 0.28 | 416 | 293 | 121 | 1227 | 0.59 | 0.77 | 0.67 | 0.36 | 0.53 | 0.43 |
| 24 | Red-billed Blue-Magpie (Urocissa erythroryncha) | 25.1% | 0.25 | 390 | 508 | 126 | 1033 | 0.43 | 0.76 | 0.55 | 0.26 | 0.92 | 0.40 |
| 25 | Scaly-breasted Munia (Lonchura punctulata) | 24.9% | 0.30 | 396 | 180 | 117 | 1364 | 0.69 | 0.77 | 0.73 | 0.25 | 0.98 | 0.40 |
| 26 | Rock Pigeon (Columba livia) | 24.4% | 0.37 | 384 | 163 | 117 | 1393 | 0.70 | 0.77 | 0.73 | 0.24 | 1.00 | 0.39 |
| 27 | Dusky Warbler (Phylloscopus fuscatus) | 23.8% | 0.31 | 391 | 241 | 98 | 1327 | 0.62 | 0.80 | 0.70 | 0.31 | 0.93 | 0.47 |
| 28 | Yellow-bellied Prinia (Prinia flaviventris) | 23.2% | 0.29 | 383 | 265 | 94 | 1315 | 0.59 | 0.80 | 0.68 | 0.26 | 0.54 | 0.35 |
| 29 | Black-winged Stilt (Himantopus himantopus) | 22.6% | 0.49 | 402 | 87 | 63 | 1505 | 0.82 | 0.86 | 0.84 | 0.24 | 0.91 | 0.38 |
| 30 | Plain Prinia (Prinia inornata) | 22.2% | 0.40 | 407 | 150 | 50 | 1450 | 0.73 | 0.89 | 0.80 | 0.23 | 0.93 | 0.37 |
| 31 | Common Sandpiper (Actitis hypoleucos) | 21.3% | 0.32 | 348 | 220 | 90 | 1399 | 0.61 | 0.79 | 0.69 | 0.24 | 0.90 | 0.38 |
| 32 | Common Myna (Acridotheres tristis) | 20.9% | 0.29 | 356 | 242 | 74 | 1385 | 0.60 | 0.83 | 0.69 | 0.22 | 0.84 | 0.35 |
| 33 | White-throated Kingfisher (Halcyon smyrnensis) | 20.7% | 0.34 | 299 | 190 | 127 | 1441 | 0.61 | 0.70 | 0.65 | 0.22 | 0.88 | 0.35 |
| 34 | Eastern Yellow Wagtail (Motacilla tschutschensis) | 20.2% | 0.43 | 351 | 136 | 65 | 1505 | 0.72 | 0.84 | 0.78 | 0.25 | 0.70 | 0.37 |
| 35 | Amur Stonechat (Saxicola stejnegeri) | 20.0% | 0.30 | 357 | 134 | 54 | 1512 | 0.73 | 0.87 | 0.79 | 0.30 | 0.76 | 0.43 |
| 36 | Common Kingfisher (Alcedo atthis) | 19.8% | 0.20 | 322 | 309 | 85 | 1341 | 0.51 | 0.79 | 0.62 | 0.24 | 0.94 | 0.38 |
| 37 | Fork-tailed Sunbird (Aethopyga christinae) | 19.1% | 0.31 | 306 | 167 | 86 | 1498 | 0.65 | 0.78 | 0.71 | 0.26 | 0.54 | 0.35 |
| 38 | Black Drongo (Dicrurus macrocercus) | 18.0% | 0.34 | 263 | 147 | 107 | 1540 | 0.64 | 0.71 | 0.67 | 0.20 | 0.93 | 0.33 |
| 39 | House Swift (Apus nipalensis) | 17.7% | 0.19 | 259 | 546 | 105 | 1147 | 0.32 | 0.71 | 0.44 | 0.20 | 0.58 | 0.29 |
| 40 | Eastern Cattle-Egret (Ardea coromanda) | 17.5% | 0.23 | 288 | 233 | 72 | 1464 | 0.55 | 0.80 | 0.65 | 0.21 | 0.74 | 0.32 |
| 41 | Common Greenshank (Tringa nebularia) | 16.8% | 0.44 | 288 | 124 | 58 | 1587 | 0.70 | 0.83 | 0.76 | 0.22 | 0.77 | 0.34 |
| 42 | Black-crowned Night Heron (Nycticorax nycticorax) | 16.7% | 0.18 | 276 | 332 | 67 | 1382 | 0.45 | 0.80 | 0.58 | 0.18 | 0.70 | 0.29 |
| 43 | Long-tailed Shrike (Lanius schach) | 15.7% | 0.27 | 272 | 212 | 50 | 1523 | 0.56 | 0.84 | 0.67 | 0.21 | 0.93 | 0.34 |
| 44 | Eurasian Moorhen (Gallinula chloropus) | 15.6% | 0.30 | 283 | 150 | 37 | 1587 | 0.65 | 0.88 | 0.75 | 0.18 | 0.64 | 0.28 |
| 45 | Pied Avocet (Recurvirostra avosetta) | 15.5% | 0.47 | 267 | 74 | 52 | 1664 | 0.78 | 0.84 | 0.81 | 0.23 | 0.57 | 0.33 |
| 46 | Little Grebe (Tachybaptus ruficollis) | 15.4% | 0.46 | 227 | 59 | 89 | 1682 | 0.79 | 0.72 | 0.75 | 0.16 | 0.46 | 0.24 |
| 47 | Collared Crow (Corvus torquatus) | 15.4% | 0.35 | 232 | 129 | 84 | 1612 | 0.64 | 0.73 | 0.69 | 0.18 | 0.56 | 0.27 |
| 48 | Great Cormorant (Phalacrocorax carbo) | 15.1% | 0.26 | 288 | 101 | 22 | 1646 | 0.74 | 0.93 | 0.82 | 0.23 | 0.96 | 0.37 |
| 49 | Wood Sandpiper (Tringa glareola) | 14.8% | 0.48 | 218 | 56 | 87 | 1696 | 0.80 | 0.71 | 0.75 | 0.20 | 0.69 | 0.31 |
| 50 | Olive-backed Pipit (Anthus hodgsoni) | 14.7% | 0.30 | 214 | 203 | 89 | 1551 | 0.51 | 0.71 | 0.59 | 0.27 | 0.88 | 0.41 |
| 51 | Blue Whistling-Thrush (Myophonus caeruleus) | 14.3% | 0.26 | 197 | 295 | 97 | 1468 | 0.40 | 0.67 | 0.50 | 0.14 | 1.00 | 0.25 |
| 52 | Common Snipe (Gallinago gallinago) | 13.0% | 0.35 | 207 | 80 | 60 | 1710 | 0.72 | 0.78 | 0.75 | 0.21 | 0.71 | 0.33 |
| 53 | Northern Shoveler (Spatula clypeata) | 12.1% | 0.29 | 228 | 126 | 21 | 1682 | 0.64 | 0.92 | 0.76 | 0.19 | 0.78 | 0.31 |
| 54 | Green-winged Teal (Anas crecca) | 12.1% | 0.47 | 183 | 73 | 66 | 1735 | 0.71 | 0.73 | 0.72 | 0.18 | 0.39 | 0.25 |
| 55 | Scarlet Minivet (Pericrocotus speciosus) | 11.8% | 0.27 | 163 | 171 | 79 | 1644 | 0.49 | 0.67 | 0.57 | 0.14 | 0.54 | 0.22 |
| 56 | Eurasian Collared-Dove (Streptopelia decaocto) | 11.2% | 0.31 | 210 | 106 | 21 | 1720 | 0.66 | 0.91 | 0.77 | 0.12 | 0.29 | 0.17 |
| 57 | Gray Wagtail (Motacilla cinerea) | 10.9% | 0.25 | 105 | 155 | 120 | 1677 | 0.40 | 0.47 | 0.43 | 0.14 | 0.66 | 0.24 |
| 58 | White-rumped Munia (Lonchura striata) | 10.6% | 0.39 | 107 | 57 | 111 | 1782 | 0.65 | 0.49 | 0.56 | 0.19 | 0.60 | 0.29 |
| 59 | Chestnut Bulbul (Hemixos castanonotus) | 9.9% | 0.30 | 171 | 79 | 33 | 1774 | 0.68 | 0.84 | 0.75 | 0.13 | 0.49 | 0.21 |
| 60 | Rufous-capped Babbler (Cyanoderma ruficeps) | 9.9% | 0.23 | 181 | 135 | 23 | 1718 | 0.57 | 0.89 | 0.70 | 0.12 | 0.49 | 0.20 |

完整数值（包括 AUC、average precision、Brier，以及 kNN 和地点 × 月份基线）见 `per_species_metrics_all_models.csv` 和 `per_species_ensemble_vs_monthly_baseline.csv`。

### 表现较弱的鸟种

F1 最低的是 Gray Wagtail（0.43）、House Swift（0.44）、Blue Whistling-Thrush（0.50）、Red-billed Blue-Magpie（0.55）和 White-rumped Munia（0.56）。原因可能有三个：这些鸟种出现率低；House Swift 这类飞行中的鸟种是否被记录到，很大程度取决于观鸟者有没有抬头看；有的鸟种分布在很多零散的林地。对于测试 AUC 低于 0.80 的鸟种，网站会自动把可信度降一级。

## 5. 可信度指标的设计

网站对每条预测返回三项信息。

1. `probability`：校准后的概率，表示一次约 2 小时的观鸟能记录到该鸟种的机会。这是最主要的可信度指标。
2. `label`：`likely`（高于该鸟种的判定阈值）、`possible`（高于阈值的一半）或 `unlikely`。
3. `level`：`high` / `medium` / `low`，表示这个数字有多可靠。默认为 high，下列每满足一条就降一级：
   - 该鸟种的测试 AUC 低于 0.80；
   - 天气不是 7 天以内的预报（8–16 天预报或月平均气候值）；
   - 用户输入的位置离最近的已建模热点超过 3 km；
   - 该地点在目标月份前后 ±1 个月内没有任何训练清单（属于外推）。

`level` 只用了测试中被证明有风险的因素。我检查过「地点当月训练清单少」这一项：这类清单的预测在测试集上同样校准良好（预测均值 0.177，实际 0.166），所以只在完全没有数据的外推情况下才降级。

## 6. 局限

- 只有一年的数据（2025-10 至 2026-09），年际差异（例如冷冬、迁徙提前）还无法评估。
- 模型只覆盖 60 个最常见的鸟种和 117 个常用地点，其中 98 个是公开热点。黑脸琵鹭等珍稀鸟种不在模型内；如需加入，要用更大的 `--top-n` 重新生成矩阵。
- 「0」表示完整清单没有报告该鸟种，不代表该鸟种一定不在场；概率反映的是被记录到的机会。
- 训练使用天文台站点的实测日天气，网站使用 Open-Meteo 预报并换算到天文台尺度（换算后的相关系数：气温 0.99、气压 1.00、湿度 0.95、风速 0.84、雨量 0.72）。预报误差会降低实际表现。
- 潮汐对后海湾、米埔的涉禽影响很大，但模型没有使用潮汐数据。

## 7. 复现

`training/` 文件夹中的脚本按顺序运行：`recover_dates.py`（反推日期）→ `recover_params.py`（反推标准化参数）→ `train_final.py`（训练、评估、导出）。详细步骤见 `README_交接说明.md`。
