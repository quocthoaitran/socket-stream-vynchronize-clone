import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'
import { Divider, Typography, Layout, Menu, Breadcrumb, Avatar, Space } from 'antd'
import Login from './Login'
import io from 'socket.io-client'
import Room from './Room'
import { UserOutlined, LaptopOutlined, NotificationOutlined } from "@ant-design/icons";
import './App.css'

const socket = io(`${window.location.hostname}:8080`, { transports: ['websocket', 'polling', 'flashsocket'] })
const { Title, Text } = Typography;
const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;

function App() {
  return (
    <Router>
      <Layout>
        <Header className="header">
          <Title type="danger" className="header-logo">Listen Together</Title>
          <Space align="center" className="header-avatar"><Title type="warning" level={3}>User 1 <Avatar icon={<UserOutlined />} /></Title></Space>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          {/* <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb> */}
          <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
            <Sider className="site-layout-background" width={200}>
              <Menu
                mode="inline"
                defaultSelectedKeys={['1']}
                defaultOpenKeys={['sub1']}
                style={{ height: '100%' }}
              >
                <Menu.Item key="1">room 1</Menu.Item>
                <Menu.Item key="2">room 2</Menu.Item>
                <Menu.Item key="3">room 3</Menu.Item>
                <Menu.Item key="4">room 4</Menu.Item>
              </Menu>
            </Sider>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>
              <Switch>
                <Route path="/room">
                  <Room socket={socket}></Room>
                </Route>
                <Route path="/" exact>
                  <Login socket={socket}></Login>
                </Route>
              </Switch>
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>
      {/* <div className="App">
        <Divider><Title><Text type="success">Listen Together</Text></Title></Divider>
      </div>

      <Switch>
        <Route path="/room">
          <Room socket={socket}></Room>
        </Route>
        <Route path="/" exact>
          <Login socket={socket}></Login>
        </Route>
      </Switch> */}
    </Router>
  );
}

export default App;
