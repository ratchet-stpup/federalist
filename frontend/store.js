import { combineReducers, createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';

import reducers from './reducers';
import { reroute, createNotifier } from './middleware';
import { notificationSettings } from './util/notificationSettings';

const reducer = combineReducers({
  ...reducers,
  router: routerReducer,
});

const history = createHistory();

const middlewares = [
  reroute,
  createNotifier(notificationSettings),
  routerMiddleware(history),
  createLogger(), // must be last in the middlewares chain
];

const store = createStore(
  reducer,
  composeWithDevTools(applyMiddleware(...middlewares))
);

const dispatch = store.dispatch;

export { dispatch, history };
export default store;
