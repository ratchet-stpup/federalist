/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import routes from './routes';
import store from './store';

require('./sass/styles.scss');

const mainEl = document.querySelector('#js-app');

render((
  <Provider store={store}>
    <Router history={browserHistory}>
      {routes}
    </Router>
  </Provider>
), mainEl);

userActions.fetchUser();
siteActions.fetchSites();
