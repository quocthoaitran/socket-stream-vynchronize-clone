import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'
import { Divider, Typography } from 'antd'
import Login from './Login'
import io from 'socket.io-client'
import Room from './Room'

const socket = io(`${window.location.hostname}:8080`, {transports: ['websocket', 'polling', 'flashsocket']})
const { Title , Text } = Typography;

function App() {
  return (
    <Router>
      <div className="App">
        <Divider><Title><Text type="success">Listen Together</Text></Title></Divider>
      </div>

      <Switch>
        <Route path="/room">
          <Room socket={socket}></Room>
        </Route>
        <Route path="/" exact>
          <Login socket={socket}></Login>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
