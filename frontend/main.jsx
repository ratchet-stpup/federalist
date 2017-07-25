/* global document:true */

import 'babel-polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import Routes from './routes';
import store, { history } from './store';

require('./sass/styles.scss');

const mainEl = document.querySelector('#js-app');

render((
  <Provider store={store} history={history}>
    <ConnectedRouter history={history}>
      <Routes />
    </ConnectedRouter>
  </Provider>
), mainEl);

userActions.fetchUser();
siteActions.fetchSites();
