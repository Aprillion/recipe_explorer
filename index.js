// (() => { // keep in global namespace while debugging
  const root = document.getElementById('root')
  const icon_urls = [
    'factorio-content',
    // '/Applications/factorio.app/Contents/data/base/graphics/icons/fluid',
    // '/Applications/factorio.app/Contents/data/base/graphics/icons', // TODO: steam, widows, linux, mods folders, ...
    // '/Applications/factorio.app/Contents/data/base/graphics/technology',
  ]
  const icons = {}
  const icons_promise = []
  let items = {}
  let recipes_obj = {}
  let recipe_tiers = {}
  let recipes
  let technologies
  let filter_element

  // local files only work in Firefox => TODO: start a server, add a file chooser?
  let recipes_promise = Promise.resolve(factorio_recipe_data.game.player.force.recipes)
  const technologies_promise = Promise.resolve(factorio_recipe_data.game.player.force.technologies)
  Promise.all([recipes_promise, technologies_promise])
    .then(([r, t]) => {
      recipes = r
      technologies = t
    })
    .then(load_icons)
    .then(extract_items)
    .then(add_technologies)
    .then(add_search)
    .then(sort_recipes)
    .then(remove_item_cycles)
    .then(categorize)
    .then(render_dom)
    .then(display_grid)
  
  function load_icons() {
    add_icon({name: 'time-icon'})
    recipes.forEach(({name, ingredients, products}) => {
      add_icon({name})
      ingredients.forEach(ingredient => {
        add_icon({...ingredient})
      })
      products.forEach(product => {
        add_icon({...product})
      })
    })
    technologies.filter(t => t.effects.length && t.effects.some(e => e.type === 'unlock-recipe'))
      .forEach(({name}) => {
        name = name.replace(/-\d+$/, '')
        add_icon({name})
      })
    return Promise.all(icons_promise).then(() => [recipes, technologies])
  }
  
  function extract_items() {
    add_icon({name: 'time-icon'})
    recipes.forEach(recipe => {
      const {name, ingredients, products} = recipe
      recipes_obj[name] = recipe // mutable reference
      ingredients.forEach(ingredient => {
        add_item({item: ingredient.name, category: 'ingredients_in', value: name})
      })
      products.forEach(product => {
        add_item({item: product.name, category: 'products_in', value: name})
      })
    })
  }
  
  function add_technologies() {
    const chain = {}
    const recipe_unlocks = {}
    technologies.forEach(({name, effects, prerequisites, researched}) => {
      chain[name] = {
        researched,
        prerequisites: Object.keys(prerequisites)
      }
      effects.length && effects.filter(({type}) => type === 'unlock-recipe').forEach(({recipe}) => {
        recipe_unlocks[recipe] = name
      })
    })
    
    recipes.forEach(recipe => {
      const name = recipe_unlocks[recipe.name]
      const prereq_enabled = prereq => chain[prereq].researched
      let reachability = 'unreachable'
      if (chain[name]) {
        if (chain[name].researched) {
          reachability = 'researched'
        } else if (chain[name].prerequisites.every(prereq_enabled)) {
          reachability = 'next'
        } else {
          reachability = 'reachable'
        }
      }
      recipe.technology = {
        name,
        reachability,
        // TODO: calculate expense of reaching this technology including all predecesor (for storting => just sum the energy)
      }
    })
  }
  
  function add_search() {
    recipes.forEach(r => {
      const inames = r.ingredients.map(i => i.name).join(' ')
      let pnames = r.products.map(p => p.name).join(' ')
      if (pnames === r.name) { pnames = '' }
      r.search = [r.name, r.technology.name, inames, pnames].join(' ')
    })
  }
  
  function sort_recipes() {
    const reachability_order = {
      [true]: 1, // 0 is falsey
      researched: 1.5,
      next: 2,
      reachable: 3,
      unreachable: 99
    }
    recipes.sort((a, b) => {
      const at = a.technology
      const bt = b.technology
      const atr = reachability_order[a.enabled || at.reachability]
      const btr = reachability_order[b.enabled || bt.reachability]
      if (atr - btr !== 0) { return atr - btr }
      
      const ao = a.order
      const bo = b.order
      if (ao < bo) { return -1 }
      if (ao > bo) { return 1 }
      return 0
    })
  }
  
  function remove_item_cycles() {
    Object.keys(items).forEach(iname => {
      const i = items[iname]
      i.products_without_cycles_in = i.products_in.filter(p => {
        if (i.ingredients_in.includes(p)) { return false }
        if (p.match(/^fill/)) { return true }  // keep filling barrels after "barrel" recipe + emptying barrels after filling
        return recipes_obj[p].ingredients.every(ingredient_of_p_recipe => {
          const i2 = items[ingredient_of_p_recipe.name]
          return i2.products_in.every(p2 => {
            return recipes_obj[p2].ingredients.every(ingredient_of_p2_recipe => {
              return ingredient_of_p2_recipe.name !== iname
              // TODO: test bigger cycles?
            })
          })
        })
      })
    })
  }
  
  function categorize() {
    let available = {}
    Object.keys(items).forEach(iname => {
      if (items[iname].products_without_cycles_in.length === 0) {
        available[iname] = true
      }
    })
    const tiers = [1, 2, 3, 4, 5, 6, 7, 8] // TODO: loop
    tiers.forEach(tier => {
      recipe_tiers[tier] = []
      const available_next = {}
      recipes.forEach(recipe => {
        if (recipe.tier) { return }
        const all_ingredients_available = recipe.ingredients.every(({name}) => available[name])
        if (all_ingredients_available) {
          recipe_tiers[tier].push(recipe)
          recipe.tier = tier
          recipe.products.forEach(({name}) => {
            available_next[name] = true
          })
        }
      })
      recipe_tiers[undefined] = []
      recipes.forEach(recipe => {
        if (recipe.tier) { return }
        recipe_tiers[undefined].push(recipe)
      })
      available = {...available, ...available_next}
    })
  }
  
  function render_dom() {
    recipes.forEach(recipe => {
      const {name, enabled, technology, ingredients, products, energy} = recipe
      const reachability = enabled ? 'enabled' : technology.reachability
      
      const ingredient_icons = div({className: 'ingredients', children: ingredients.map(item => (
        div({className: null, children: [
          div({className: null, children: amount(item)}),
          img({name: item.name})
        ]}))
      )})
      const big_icon_and_time = div({className: 'big_icon_and_time', children: [
        div({className: 'big_icon', children: img({name})}),
        div({className: 'time', children: [
          img({name: 'time-icon'}),
          energy
        ]}),
        technology.name && div({className: 'technology', children: ['T:', img({name: technology.name})]})
      ]})
      const show_products = true // products.length > 1 || products[0].name !== name || products[0].amount !== 1
      let product_icons = ''
      if (show_products) {
        product_icons = div({className: 'products', children: products.map(item => (
          div({className: null, children: [
            img({name: item.name}),
            amount(item)
          ]}))
        )})
      }
      
      recipe.dom = div({className: `recipe ${reachability}`, children: [ingredient_icons, big_icon_and_time, product_icons]})
    })
  }
  
  function display_grid() {
    root.innerText = ''
    const tier_columns = []
    Object.keys(recipe_tiers).forEach(tier => {
      recipe_tiers[tier].length > 0 && tier_columns.push(recipe_tiers[tier])
    })
    const placeholder = 'Type to filter (e.g. oil), click on icons, use back button or ESC'
    filter_element = input({
      type: 'text',
      className: 'filter',
      placeholder,
      title: placeholder,
      onChange: e => {
        location.hash = filter_element.value
      }
    })
    root.appendChild(div({className: "filter-wrapper", children: [filter_element]}))
    filter_element.select()
    
    const grid = tier_columns.map(tier => {
      return div({className: "tier", children: tier.map(recipe => recipe.dom)})
    })
    root.appendChild(div({className: "grid", children: grid}))
    
    document.onkeyup = e => {
      if (e.key === 'Escape') {
        filter_element.value = ''
        filter_element.focus()
        location.hash = ''
      }
    }
    onhashchange = e => {
      const value = decodeURIComponent(location.hash.substr(1))
      document.title = (value && `${value} - `) + 'Factorio recipes'
      filter_element.value = value
      filter_grid()
    }
    if (location.hash) {
      onhashchange()
    }
  }
  
  // ### Utils ###
  
  function add_icon({name, type}) {
    if (icons[name]) { return }
    const img = new Image()
    icons[name] = img
    img.alt = name
    img.title = name
    
    // try multiple url prefixes when loading fails
    const remaining_urls = [...icon_urls].reverse()
    icons_promise.push(new Promise((resolve, reject) => {
      const change_src = () => {
        let url = remaining_urls.pop()
        url = `${url}/${name}.png`
        if (remaining_urls.length === 0) {
          img.onerror = () => console.warn('icon not found:', name) // before setting src
          resolve() // do not reject because Promise.all should wait for all
        }
        img.src = url
      }
      img.onerror = change_src
      img.onload = () => resolve()
      change_src()
    }))
  }
  
  function add_item({item, category, value}) {
    if (!items[item]) {
      items[item] = {ingredients_in: [], products_in: [], products_without_cycles_in: []}
    }
    items[item][category].push(value)
  }
  
  function amount(item) {
    if (item.amount) {
      return item.amount === 1 ? '' : item.amount
    }
    return item.probability * (item.amount_min + item.amount_max) / 2
  }
  
  function filter_grid() {
    let filter_value = filter_element.value
    let exact = false
    if (filter_value.match(/"/)) {
      // "exact match" undocumented feature, not well defined yet
      exact = true
      filter_value = filter_value.replace(/"/g, '')
    }
    const terms = filter_value.split(' ')
    recipes.forEach(recipe => {
      let match
      if (exact) {
        match = terms.every(t => recipe.search.match(new RegExp(`(?:^| )${t}(?: |$)`)))
      } else {
        match = terms.every(t => recipe.search.match(t))
      }
      if (match) {
        recipe.dom.classList.remove('filtered')
      } else {
        recipe.dom.classList.add('filtered')
      }
    })
  }
  
  // ### DOM library placeholder ###
  
  function div({children, ...props} = {children: []}) {
    const el = document.createElement('div')
    Object.keys(props).forEach(p => {
      el[p] = props[p]
    })
    if (!Array.isArray(children)) {
      children = [children]
    }
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        el.appendChild(child)
      } else if (child != undefined) {
        el.appendChild(document.createTextNode(child))
      }
    })
    return el
  }
  
  function img({name}) {
    const img = new Image()
    const full_name = name
    if (!icons[name]) {
      name = name.replace(/-\d+$/, '')
    }
    img.title = full_name
    img.alt = name
    if (full_name !== 'time-icon') {
      img.onclick = e => {
        location.hash = `"${full_name}"`
      }
    }
    if (icons[name]) {
      img.src = icons[name].src
    } else {
      console.warn('icon not prefetched: ', name)
    }
    return img
  }
  
  function input({onChange, ...props} = {}) {
    const el = document.createElement('input')
    Object.keys(props).forEach(p => {
      el[p] = props[p]
    })
    
    let old_value = ''
    let timeout
    el.onkeyup = e => {
      if (e.target.value !== old_value) {
        old_value = e.target.value
        clearTimeout(timeout)
        timeout = setTimeout(onChange, 500, e)
      } else if (e.key === 'Enter') {
        clearTimeout(timeout)
        onChange(e)
      }
    }
    return el
  }
  
  function label({children, ...props} = {children: []}) {
    const el = document.createElement('label')
    Object.keys(props).forEach(p => {
      el[p] = props[p]
    })
    if (!Array.isArray(children)) {
      children = [children]
    }
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        el.appendChild(child)
      } else if (child != undefined) {
        el.appendChild(document.createTextNode(child))
      }
    })
    return el
  }
// })()
