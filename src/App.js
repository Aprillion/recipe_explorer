import React from 'react';
import './App.css';

class App extends React.PureComponent {
  state = {query: ''}
  
  handleQueryChange = (e) => {
    this.setState({query: e.target.value})
  }
  
  render() {
    const {groups} = this.props
    const {query} = this.state
    return (
      <div className="App">
        <input className="App-query" onChange={this.handleQueryChange} />
        {groups.map(({name, subgroups}) => <Group {...{name, subgroups, query}} />)}
      </div>
    )
  }
}

class Group extends React.PureComponent {
  render() {
    const {name, subgroups, query} = this.props
    return (
      <div className="Group">
        {subgroups.map(({name, recipes}) => <SubGroup {...{name, recipes, query}} />)}
      </div>
    )
  }
}

class SubGroup extends React.PureComponent {
  render() {
    const {name, recipes, query} = this.props
    return (
      <div className="SubGroup">
        {recipes.map(({name, icon}) => <Recipe {...{name, icon, query}} />)}
      </div>
    )
  }
}

class Recipe extends React.PureComponent {
  render() {
    const {name, icon, query} = this.props
    return (
      <div className="Recipe">
        <img scr={icon} alt={name} title={name} />
      </div>
    )
  }
}

export default App;
