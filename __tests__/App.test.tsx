/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

// This only exercises the initial (pre-database-ready) loading render of
// App, since fully mounting the navigation/provider tree would require
// deep native-module mocking (SQLite rows, Bluetooth, camera, Reanimated
// contexts, etc.) with little added verification value in a unit test —
// the real end-to-end flow is exercised on-device instead.
it('renders correctly', () => {
  renderer.create(<App />);
});
