# Generated 3D ingredients

Drop a `.glb` here and list it in `manifest.json`, and it replaces the
code-built shape for that ingredient on the menu. Anything not listed keeps
its built shape, so the set can be filled in one piece at a time.

```json
{ "bun-top": "bun-top.glb", "patty": "patty.glb" }
```

The key is the ingredient's layer key. One object per file, nothing else in
the scene. Size and position do not matter - the page scales and centres it.
Keep each file small (aim under 1 MB: low polygon count, no PBR maps).

| key | prompt |
| --- | --- |
| `bun-top` | top half of a sesame seed burger bun, golden brown, flat cut underside, single isolated object |
| `bun-bottom` | bottom half of a burger bun, toasted cut face on top, single isolated object |
| `patty` | single round grilled beef burger patty with charcoal grill marks, isolated object |
| `chicken` | single round crispy fried chicken burger fillet, golden breadcrumb crust, isolated object |
| `cheese` | single square slice of melted cheddar cheese, corners drooping, isolated object |
| `tomato` | single round slice of fresh tomato, isolated object |
| `lettuce` | single flat leaf of green lettuce, ruffled edge, isolated object |
| `onion` | three raw red onion rings lying flat, isolated object |
| `pickles` | four round pickle slices lying flat, isolated object |
| `egg` | single fried egg, flat, yolk in the middle, isolated object |
| `sauce` | flat round splash of ketchup, isolated object |
| `sausage` | single grilled hot dog sausage, isolated object |
| `hotdog-bun-top` | top half of a long hot dog bun, isolated object |
| `hotdog-bun-bottom` | bottom half of a long hot dog bun, isolated object |
| `fries` | bunch of french fries standing upright, no container, isolated object |
| `fries-box` | empty red french fries carton, isolated object |
| `cheese-sauce` | small flat puddle of melted cheese sauce, isolated object |
| `soft-drink` | white paper cup with a red band, plastic lid and red straw, isolated object |
| `water-bottle` | small clear plastic water bottle with a blue label and blue cap, isolated object |
