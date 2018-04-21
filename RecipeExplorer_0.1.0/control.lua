require('export_to_js')

function export_on_game_load()
  export_recipes()
  export_technologies()
  script.on_nth_tick(nil)
end

script.on_nth_tick(6, export_on_game_load)
script.on_configuration_changed(export_on_game_load)
script.on_event(defines.events.on_research_finished, export_technologies)
