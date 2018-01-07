Proof of concept for Factorio recipe explorer tool.

Currently data are visualized as a web page outside of Factorio because I know JS much better than trying to write GUI in via Factorio's Lua API... Also easier to publish on github pages this way :)

Not ready for external users yet, but feel free to report github issues.

## Notes
### dump_json.lua
- copy&paste to Factorio console (press ` in a game)
- go to https://wiki.factorio.com/Application_directory#User_Data_directory and get scripts_output/recipe_explorer/*.json files
- TODO: make a mod - either console command or shortcut or automatically when loading/saving

### index.html
- recipes sorted by dependencies to 8 columns, recipes on right require ingredients that are products of the recipes on the left (note: wrapped columns on narrow screen)
- each recipe has ingredients on the left, products on the right, energy and unlocking technology at the bottom
- tooltips display the internal "name" property of recipe/item/fluid/technology (no localization yet)
- background color green = available, yellow = possible to research unlocking technology, red = possible to unlock by a technology after researching its dependencies, gray = not possible to research (only unlock via a console command)
- for testing from file system, copy files produced by dump_json.lua in the same directory and open in Firefox (or start a web server)
- TODO: verify with Factorio team whether I can publish icons (and localizations) in my github repository (or load some other way)
- TODO: load icons from mods (popular ones maybe on github too), ... switch from paper to github issues
