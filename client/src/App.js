import React, { useEffect, useState } from "react";
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
  Tooltip,
} from "antd";
import io from "socket.io-client";
import Room from "./Room";
import {
  UserOutlined,
} from "@ant-design/icons";
import "./App.css";
import "antd/dist/antd.css";

const socket =
  localStorage.getItem("socket") ||
  io(`${window.location.hostname}:8080`, {
    transports: ["websocket", "polling", "flashsocket"],
  });
const { Title } = Typography;
const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [username, setUsername] = useState("");
  const [isModalUsernameVisible, setIsModalUsernameVisible] = useState(false);
  const [listRoom, setListRoom] = useState([]);
  const [roomID, setRoomID] = useState("");
  useEffect(() => {
    if (!localStorage.getItem("username")) {
      setIsModalUsernameVisible(true);
    } else {
      socket.emit("init_user", localStorage.getItem("username"));
      setUsername(localStorage.getItem("username"));
    }

    socket.on("update_list_room", (rooms) => {
      setListRoom(rooms);
    });

    socket.emit("get_rooms");
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
      });
      return;
    }
    socket.emit("join_room", { roomID });
    setRoomID("");
  };

  const handleJoinRoom = (room) => {
    socket.emit("join_room", { roomID: room });
  };

  return (
    <>
    {console.log("idddddddddddddddddddddddd",socket.roomID)}
      <Modal
        title="Enter Username"
        visible={isModalUsernameVisible}
        onOk={handleChangeUsername}
        cancelButtonProps={{ disabled: true }}
        closable={false}
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
            <Title
              type="warning"
              level={3}
              onClick={() => setIsModalUsernameVisible(true)}
            >
              {username} <Avatar icon={<UserOutlined />} />
            </Title>
          </Space>
        </Header>
        <Content style={{ padding: "0 50px" }}>
          <Layout
            className="site-layout-background"
            style={{ padding: "24px 0" }}
          >
            <Sider className="site-layout-background" width={300} collapsedWidth={0} breakpoint={'lg'}>
              <Input
                placeholder="Enter room ID"
                value={roomID}
                onChange={(e) => {
                  setRoomID(e.target.value);
                }}
                suffix={
                  <Button type="primary" onClick={handleCreateRoom}>
                    Create/Join room
                  </Button>
                }
              />
              <Menu
                mode="inline"
                // defaultSelectedKeys={['1']}
                // defaultOpenKeys={['sub1']}
                style={{ height: "100%" }}
              >
                {listRoom.length ? (
                  listRoom.map((room, index) => {
                    return (
                      <Menu.Item key={index}>
                        <Tooltip
                          title={`${room.hostName} - ${room.currVideo.title}`}
                          placement="top"
                        >
                          <span
                            key={index}
                            onClick={() => handleJoinRoom(room.room)}
                          >
                            {room.room}
                          </span>
                        </Tooltip>
                      </Menu.Item>
                    );
                  })
                ) : (
                  <Menu.Item>
                    <Empty description="No room available" />
                  </Menu.Item>
                )}
              </Menu>
            </Sider>
            <Content style={{ padding: "0 24px", minHeight: 280 }}>
              {socket && <Room socket={socket}></Room>}
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer>
      </Layout>
      </>
  );
}

export default App;
