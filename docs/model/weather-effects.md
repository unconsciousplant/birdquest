# How weather changes the model's predictions

The **Plan a trip** screen lets you set the weather yourself, for demonstrations. This note shows how much each weather input actually moves the predictions. The controls are listed in this order, from biggest to smallest effect.

Measured on 22 Nov 2026 with `node scripts/weather-effects.mjs`. Re-run it after retraining the model.

## Method

- Start with the typical weather for the month (the model's monthly averages).
- Move **one** input from low to high: the training mean minus 2 standard deviations, up to the mean plus 2 standard deviations, kept within physical limits. Wind direction compares the 8 compass points instead.
- Record how much each species' **chance of recording** changes, for all 60 species at all 98 hotspots, on 15 January, April, July and October, for a 2-hour visit starting at 07:00. That makes 94,080 comparisons per input.
- "Points" are percentage points. For example, 40% → 45% is a 5-point change.

## Results

| Weather input | Range tested | Average change | 95th percentile | Largest change |
|---|---|---|---|---|
| Average temperature (°C) | 14.7 to 32.8 | 5.5 points | 20.7 points | 58.3 points |
| Wind direction | 8 compass points | 4.5 points | 15.3 points | 37.4 points |
| Average wind speed (km/h) | 3.3 to 15.6 | 3.3 points | 13.1 points | 35.3 points |
| Sunshine (hours) | 0.0 to 13.0 | 3.1 points | 12.1 points | 30.1 points |
| Humidity (%) | 52.6 to 94.0 | 3.0 points | 11.7 points | 37.4 points |
| Temperature change since yesterday (°C) | −2.8 to 3.0 | 2.8 points | 11.1 points | 28.9 points |
| Cloud cover (%) | 6.6 to 100.0 | 2.6 points | 10.5 points | 30.9 points |
| Air pressure change since yesterday (hPa) | −3.7 to 3.9 | 2.4 points | 9.5 points | 26.9 points |
| Rain over 3 days (mm) | 0.0 to 77.9 | 1.7 points | 6.5 points | 20.3 points |
| Rain today (mm) | 0.0 to 28.8 | 1.6 points | 6.3 points | 18.1 points |

All ten inputs affect the predictions; none is negligible. Most predictions move by only a few points, but some species at some places move by 20–58 points.

## Things to know when demonstrating

- **Temperature matters most,** but it also carries the season. A hot day in November is unusual, so a big temperature change partly acts like "a different time of year".
- **Rain has the smallest average effect, and sometimes the effect is surprising.** The model learned from checklists people actually submitted. On rainy days fewer casual birders go out, so the checklists that do exist may come from keener observers who record more species. For example, the "Rainy" setting raises the expected number of species at Mai Po in late November from about 31 to 38. That's a pattern in the data, not proof that birds are easier to see in the rain.
- **Wind is measured at the Hong Kong Observatory,** a sheltered city site, so its values are lower than open-country wind.
- **Chosen weather is a what-if, not a forecast.** Results keep the same one-level reliability reduction as typical weather.

### Good demonstration examples (29 Nov 2026, 07:00–10:00)

| Place | Bird | Cold northerly winds | Sunny | Typical | Rainy |
|---|---|---|---|---|---|
| Victoria Peak | Dusky Warbler | 18% | 23% | 38% | 56% |
| Hong Kong Park | Dusky Warbler | 10% | 11% | 20% | 42% |
| Mai Po Nature Reserve | Asian Koel | 37% | 36% | 38% | 74% |
| Hong Kong Wetland Park | Red-billed Blue-Magpie | 51% | 43% | 52% | 76% |

These come from the "What can I see?" question with the quick weather settings. The large jumps with rain are worth discussing critically, as explained above.
