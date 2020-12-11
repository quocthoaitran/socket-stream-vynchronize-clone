import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import {
  Typography,
  Layout,
  Menu,
  Avatar,
  Space,
  Modal,
  Button,
  Input,
  Empty,
  notification,
} from "antd";
import Login from "./Login";
import io from "socket.io-client";
import Room from "./Room";
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import "./App.css";

const socket =
  localStorage.getItem("socket") ||
  io(`${window.location.hostname}:8080`, {
    transports: ["websocket", "polling", "flashsocket"],
  });
const { Title, Text } = Typography;
const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [username, setUsername] = useState("");
  const [isModalUsernameVisible, setIsModalUsernameVisible] = useState(false);
  const [listRoom, setListRoom] = useState([]);
  const [roomID, setRoomID] = useState("");
  useEffect(() => {
    if (!localStorage.getItem('username')) {
      setIsModalUsernameVisible(true);
    } else {
      socket.emit("init_user", localStorage.getItem('username'))
      setUsername(localStorage.getItem('username'))
    }

    socket.on("update_list_room", (rooms) => {
      setListRoom(rooms);
    });
    return () => {};
  }, []);

  const handleChangeUsername = () => {
    socket.emit("init_user", username);
    localStorage.setItem("username", username);
    setIsModalUsernameVisible(false);
  };

  const handleCreateRoom = () => {
    if (!roomID) {
      notification["error"]({
        message: "Invalid roomID",
        description: "Please enter a room ID",
        duration: 2,
      })
      return
    }
    socket.emit('join_room', {roomID})
    setRoomID('')
  }

  return (
    <Router>
      <Modal
        title="Enter Username"
        visible={isModalUsernameVisible}
        onOk={handleChangeUsername}
        cancelButtonProps={{ disabled: true }}
      >
        <p>We can call you are:</p>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </Modal>

      <Layout>
        <Header className="header">
          <Title type="danger" className="header-logo">
            Listen Together
          </Title>
          <Space align="center" className="header-avatar">
            <Title type="warning" level={3}>
              {username} <Avatar icon={<UserOutlined />} />
            </Title>
          </Space>
        </Header>
        <Content style={{ padding: "0 50px" }}>
          <Layout
            className="site-layout-background"
            style={{ padding: "24px 0" }}
          >
            <Sider className="site-layout-background" width={300}>
              <Menu
                mode="inline"
                // defaultSelectedKeys={['1']}
                // defaultOpenKeys={['sub1']}
                style={{ height: "100%" }}
              >
                <Input
                  placeholder="Enter room ID"
                  value={roomID}
                  onChange={(e) => {
                    setRoomID(e.target.value);
                  }}
                  suffix={<Button type="primary" onClick={handleCreateRoom}>Create/Join room</Button>}
                />
                {listRoom.length ? (
                  listRoom.map((room, index) => {
                    return <Menu.Item key={index}>{room}</Menu.Item>;
                  })
                ) : (
                  <Empty description="No room available" />
                )}
              </Menu>
            </Sider>
            <Content style={{ padding: "0 24px", minHeight: 280 }}>
              {/* <Switch>
                <Route path="/room">
                  <Room socket={socket}></Room>
                </Route>
                <Route path="/" exact>
                  <Login socket={socket}></Login>
                </Route>
              </Switch> */}
              {socket && <Room socket={socket}></Room>}
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer>
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
