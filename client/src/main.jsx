import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import axios from 'axios';
import { startDeployFreshnessWatch } from './lib/deployFreshness';

// NOTE: there is deliberately no global `axios.defaults.baseURL` here.
//
// Every plain-axios call in this app passes a path that already starts with
// `/api` (54 of them: settings, FAQs, blog, success stories, content CMS …). A
// global baseURL of `$VITE_API_URL/api` therefore turned those requests into
// `${VITE_API_URL}/api/api/...`, and a build that set VITE_API_URL served 404s
// for site settings, FAQs and blog articles while looking perfectly configured.
//
// The public content calls are same-origin on purpose: the deployment proxies
// `/api` to the API service. Code that needs an absolute API host uses the
// shared client in `lib/api.js`, which applies VITE_API_URL once, correctly.

// Automatically inject JWT authorization token across all axios instances
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*
 * If this document is older than the server's build (a CDN or carrier copy of
 * index.html still pointing at the previous bundle), reload it once with a
 * cache-busting query. See lib/deployFreshness.js for why a fresh phone was
 * seeing old content while the client's own laptop looked current.
 */
startDeployFreshnessWatch();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
