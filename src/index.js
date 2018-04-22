import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const groups = [{
  name: 'a',
  icon: 'src',
  subgroups: [{
    name: 'aa',
    recipes: [{
      name: 'aaa',
      icon: 'icon '
    }]
  }]
}]

ReactDOM.render(<App {...{groups}} />, document.getElementById('root'));
registerServiceWorker();
