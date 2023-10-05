/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import {ScriptManager, Script, Federated} from '@callstack/repack/client';
import {name as appName} from './app.json';
import App from './App';

const resolveURL = Federated.createURLResolver({
  containers: {
    rnminiappone:
      'https://github.com/vlack-coder/repacbundle/releases/download/repack-android/rnminiappone.container.bundle',
    // rnminiappone:
    //   'https://cdn.jsdelivr.net/gh/vlack-coder/repacbundle@main/assets/index.android.bundle',
    rnminiapptwo: 'http://localhost:8084/[name][ext]',
    app1: 'http://localhost:9005/[name][ext]',
  },
});
console.log('resolveURL', resolveURL);
ScriptManager.shared.addResolver(async (scriptId, caller) => {
  let url;
  if (caller === 'main') {
    url = Script.getDevServerURL(scriptId);
  } else {
    url = resolveURL(scriptId, caller);
  }
  if (!url) {
    return undefined;
  }
  console.log('urlssuwggy', url);

  return {
    url,
    cache: false, // For development
    query: {
      platform: Platform.OS,
    },
  };
});

AppRegistry.registerComponent(appName, () => App);
