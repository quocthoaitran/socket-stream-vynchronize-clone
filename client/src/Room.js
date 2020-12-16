import React, { useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Input,
  Card,
  Divider,
  notification,
  Button,
  Modal,
  Typography,
  List,
  Comment,
} from "antd";
import ReactPlayer from "react-player";
import Slider from "react-styled-carousel";
import {
  RightOutlined,
  CloseOutlined,
  StepForwardOutlined,
  UserOutlined,
} from "@ant-design/icons";

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

const { Search } = Input;
const { Meta } = Card;
const { Text } = Typography
const axios = require("axios");

export default function Room({ socket }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [listMessage, setListMessage] = useState([]);
  const [hostName, setHostName] = useState("");
  const [isHost, setIsHost] = useState(true);
  const [currVideo, setCurrVideo] = useState(null);
  const [ytLink, setYtLink] = useState("");
  const [queueVideo, setQueueVideo] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clientRequest, setClientRequest] = useState(null);
  let messagesEndRef = useRef();
  let reactPlayerRef = useRef();

  useEffect(() => {
    socket.emit("check_connection", (data) => {
      setIsHost(data.isHost);
    });

    socket.on("get_users", (users) => {
      setUsers(users);
    });

    socket.on("new_message", (data) => {
      setListMessage(listMessage => [
        ...listMessage,
        {username: data.user, message: data.message}
      ]);
      scrollBottom();
    });

    socket.on("change_host_label", (data) => {
      setHostName(data);
      socket.emit("check_connection", (data) => {
        setIsHost(data.isHost);
      });
    });

    socket.on("change_video_client", (data) => {
      setCurrVideo(data);
      // if (reactPlayerRef.current) {
      //   reactPlayerRef.current.seekTo(data.time)
      // }
    });

    socket.on("get_video_list", (data) => {
      setQueueVideo(data.queueVideo);
    });

    socket.on("confirm_request", (data) => {
      setIsModalVisible(true);
      setClientRequest(data);
    });

    socket.on("answer_request", (data) => {
      setRequestLoading(false);
      if (data) {
        notification["success"]({
          message: "Request accepted",
          description: "You are host this room",
          duration: 3,
        });
      } else {
        notification["error"]({
          message: "Request rejected",
          description: "The host this room was rejected your request",
          duration: 3,
        });
      }
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (reactPlayerRef.current && !isHost) {
      // reactPlayerRef.current.seekTo(currVideo?.time || 0, "seconds");
    }
    return () => {};
  }, [currVideo]);

  const scrollBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChangeMessage = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmitMessage = (e) => {
    if (!message) {
      // notification["error"]({
      //   message: "Invalid Message",
      //   description: "Please enter a message",
      //   duration: 1,
      // });
      return;
    }
    socket.emit("send_message", message);
    setMessage("");
  };

  const handlePauseVideo = () => {
    if (isHost) {
      socket.emit("sync_video", { playing: false });
    }
  };

  const handlePlayVideo = () => {
    if (isHost) {
      let currTime = Math.round(reactPlayerRef.current.getCurrentTime());
      socket.emit("sync_video", { playing: true, time: currTime });
    }
  };

  const handleChangeYoutubeLink = (e) => {
    setYtLink(e.target.value);
  };

  const handleSubmitYoutubeLink = async (e) => {
    let videoId =
      ytLink.split("v=")[1]?.split("&")[0] ||
      ytLink.split("/")[ytLink.split("/").length - 1];
    if (videoId === undefined) {
      notification["error"]({
        message: "Invalid youtube link",
        description: "Please enter a valid link",
        duration: 1,
      });
      return;
    }

    let data = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?key=AIzaSyA3iBc8feZzCipnYwiq-SSozzK0dwmBcms&part=snippet&id=${videoId}`
    );

    if (!data.data.items.length) {
      notification["error"]({
        message: "Invalid youtube link",
        description: "Please enter a valid link",
        duration: 1,
      });
      return;
    }

    let videoItem = {
      url: ytLink,
      img:
        data.data.items[0].snippet.thumbnails.standard?.url ||
        data.data.items[0].snippet.thumbnails.high?.url,
      title: data.data.items[0].snippet.title,
    };
    socket.emit("enqueue_video", videoItem);
    setYtLink("");
  };

  const handleClickQueueVideo = (item, index) => {
    if (isHost) {
      socket.emit("play_video", { url: item.url, title: item.title, index });
    } else {
      notification["error"]({
        message: "Can't permission",
        description: "You aren't the host this room",
        duration: 2,
      });
    }
  };

  const handleDeleteQueueItem = (e, index) => {
    e.stopPropagation();
    if (isHost) {
      socket.emit("delete_queue_item", index);
    } else {
      notification["error"]({
        message: "Can't permission",
        description: "You aren't the host this room",
        duration: 2,
      });
    }
  };

  const handleEndedVideo = () => {
    handleNextVideo();
  };

  const handleNextVideo = () => {
    if (isHost && queueVideo.length) {
      socket.emit("play_video", { url: queueVideo[0].url, index: 0 });
    }
  };

  const handleRequestHost = () => {
    if (!isHost) {
      socket.emit("request_to_change_host");
      setRequestLoading(true);
    }
    setTimeout(() => {
      setRequestLoading(false);
    }, 5000);
  };

  const handleOk = () => {
    socket.emit("host_confirm_request", { ...clientRequest, isConfirm: true });
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    socket.emit("host_confirm_request", { ...clientRequest, isConfirm: false });
    setIsModalVisible(false);
  };

  return (
    <div>
      <Modal
        title="Confirm Request"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>The {clientRequest?.username} was request to host this room</p>
      </Modal>
      <Row gutter={16}>
        <Col xxl={16} xs={24}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <h3>Current Host: {hostName}</h3>
            </Col>
            <Col xxl={24} xl={24} lg={24}>
              <div style={{width: '100%', height: '100%'}}>
                <ReactPlayer
                  ref={reactPlayerRef}
                  playing={currVideo?.playing}
                  url={currVideo?.url}
                  onPause={() => handlePauseVideo()}
                  onPlay={handlePlayVideo}
                  played="true"
                  width="48vw"
                  height="27vw"
                  muted
                  controls={isHost}
                  onEnded={() => handleEndedVideo()}
                  config={{
                    youtube: {
                      playerVars: {
                        start: currVideo?.time,
                      },
                    },
                  }}
                />
              </div>
            </Col>

            <Col xxl={24} xl={24} lg={24}>
              <Row gutter={[8, 8]}>
                <Col>
                  <Button
                    type="primary"
                    disabled={queueVideo.length ? false : true}
                    onClick={() => handleNextVideo()}
                  >
                    <StepForwardOutlined /> NEXT
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    disabled={isHost}
                    onClick={() => handleRequestHost()}
                    loading={requestLoading}
                  >
                    Request to host this room
                  </Button>
                </Col>
                <Col>
                  <Search
                    onChange={(e) => handleChangeYoutubeLink(e)}
                    placeholder="Enter Youtube link"
                    value={ytLink}
                    enterButton="Add to Queue"
                    onSearch={(e) => handleSubmitYoutubeLink(e)}
                    style={{ width: 300 }}
                  />
                </Col>
              </Row>
            </Col>
            <Col span={24}>
              <Slider
                cardsToShow={3}
                LeftArrow={<RightOutlined />}
              >
                {queueVideo.map((videoItem, index) => {
                  return (
                    <Card
                      extra={
                        <a onClick={(e) => handleDeleteQueueItem(e, index)}>
                          <CloseOutlined />
                        </a>
                      }
                      key={index}
                      hoverable
                      cover={<img alt="video_img" src={videoItem.img} />}
                      onClick={() => handleClickQueueVideo(videoItem, index)}
                      style={{ margin: 20 }}
                    >
                      <Meta title={videoItem.title} />
                    </Card>
                  );
                })}
              </Slider>
            </Col>
          </Row>
        </Col>
        <Col xxl={8} xs={18} justify="center">
          {/* <Divider>Online Users</Divider> */}
          <Card title="Online Users" bordered={false} style={{ width: "auto", marginLeft: "auto" }}>
            <div style={{ width: "auto", height: 100, overflowY: "auto" }}>
              {users &&
                users.map((user, index) => (
                  <p key={index} className="font-weight-bold">
                    {user}
                  </p>
                ))}
            </div>
          </Card>
          <Divider>Chat room</Divider>
          <Card title="Messages" bordered={false} width="300">
            <div style={{ width: "auto", height: 400, overflowY: "auto" }}>
              {listMessage &&
                // listMessage.map((message, index) => (
                //   <div style={{display: "block"}} key={index}><Text strong>{message.username}</Text>: <Text>{message.message}</Text></div>
                // ))}
                <List
                  className="comment-list"
                  // header={`${data.length} replies`}
                  itemLayout="horizontal"
                  dataSource={listMessage}
                  renderItem={item => (
                    <li>
                      <Comment
                      // style={{borderRadius: '2%',backgroundColor: "#F5F8F3" }}
                        // actions={item.actions}
                        author={<Text strong>{item.username}</Text>}
                        avatar={<UserOutlined />}
                        content={<><Text>{item.message}</Text><Divider /></>}
                      />
                    </li>
                  )}
                />
                }
              <div
                style={{ float: "left", clear: "both" }}
                ref={messagesEndRef}
              ></div>
            </div>
          </Card>
          <Search
            onChange={(e) => handleChangeMessage(e)}
            placeholder="Enter message"
            value={message}
            enterButton={<Button disabled={!message} type="primary">Send</Button>}
            loading
            onSearch={(e) => handleSubmitMessage(e)}
          ></Search>
        </Col>
      </Row>
    </div>
  );
}
