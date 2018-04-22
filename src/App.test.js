import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

it('renders without crashing', () => {
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
  const div = document.createElement('div');
  ReactDOM.render(<App {...{groups}} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
