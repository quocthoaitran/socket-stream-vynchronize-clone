import React, { useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Input,
  Card,
  Divider,
  notification,
  Button,
  Modal
} from "antd";
import ReactPlayer from "react-player";
import { useHistory } from "react-router-dom";
import Slider from "react-styled-carousel";
import { RightOutlined, CloseOutlined, StepForwardOutlined } from "@ant-design/icons";

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

const { Search } = Input;
const { Meta } = Card;
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
  const [requestLoading, setRequestLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [clientRequest, setClientRequest] = useState(null)
  let messagesEndRef = useRef();
  let reactPlayerRef = useRef();
  let history = useHistory();

  useEffect(() => {
    socket.emit("check_connection", (data) => {
      if (!data?.connected) {
        history.push("/", { roomID: history.location.pathname });
      }
      setIsHost(data.isHost);
    });

    socket.on("get_users", (users) => {
      setUsers(users);
    });

    socket.on("new_message", (data) => {
      setListMessage((listMessage) => [
        ...listMessage,
        `<p><strong>${data.user}</strong>: ${data.message}</p>`,
      ]);
      scrollBottom();
    });

    socket.on("change_host_label", (data) => {
      setHostName(data);
      socket.emit("check_connection", (data) => {
        if (!data?.connected) {
          history.push("/", { roomID: history.location.pathname });
        }
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

    socket.on('confirm_request', data => {
      console.log("confirm", data)
      setIsModalVisible(true)
      setClientRequest(data)
    })

    socket.on('answer_request', data => {
      setRequestLoading(false)
      if (data) {
        notification["success"]({
          message: "Request accepted",
          description: "You are host this room",
          duration: 3,
        })
      } else {
        notification["error"]({
          message: "Request rejected",
          description: "The host this room was rejected your request",
          duration: 3,
        })
      }
    })

    return () => {
    }
  }, []);

  useEffect(() => {
    if (reactPlayerRef.current && !isHost) {
      reactPlayerRef.current.seekTo(currVideo?.time || 0, "seconds");
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
      notification["error"]({
        message: "Invalid Message",
        description: "Please enter a message",
        duration: 1,
      });
      return;
    }
    socket.emit("send_message", message);
    setMessage("");
  }

  const handlePauseVideo = () => {
    if (isHost) {
      socket.emit("sync_video", { playing: false });
    }
  }

  const handlePlayVideo = () => {
    if (isHost) {
      let currTime = Math.round(reactPlayerRef.current.getCurrentTime());
      socket.emit("sync_video", { playing: true, time: currTime });
    }
  }

  const handleOnSeek = (e) => {
    console.log("Seekkkk", e);
  }

  const handleChangeYoutubeLink = (e) => {
    setYtLink(e.target.value);
  }

  const handleSubmitYoutubeLink = async (e) => {
    let videoId = ytLink.split("v=")[1]?.split("&")[0] || ytLink.split("/")[ytLink.split("/").length -1];
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
    )
    
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
      img: data.data.items[0].snippet.thumbnails.standard?.url || data.data.items[0].snippet.thumbnails.high?.url,
      title: data.data.items[0].snippet.title,
    };
    socket.emit("enqueue_video", videoItem);
    setYtLink("");
  }

  const handleClickQueueVideo = (item, index) => {
    if (isHost) {
      socket.emit("play_video", {url: item.url, index});
    } else {
      notification["error"]({
        message: "Can't permission",
        description: "You aren't the host this room",
        duration: 2,
      })
    }
  }

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
    handleNextVideo()
  }

  const handleNextVideo = () => {
    if (isHost && queueVideo.length) {
      socket.emit("play_video", {url: queueVideo[0].url, index: 0})
    }
  }

  const handleRequestHost = () => {
    if (!isHost) {
      socket.emit('request_to_change_host')
      setRequestLoading(true)
    }
    setTimeout(() => {
      setRequestLoading(false)
    }, 5000);
  }

  const handleOk = () => {
    socket.emit('host_confirm_request', {...clientRequest, isConfirm: true})
    setIsModalVisible(false)
  }

  const handleCancel = () => {
    socket.emit('host_confirm_request', {...clientRequest, isConfirm: false})
    setIsModalVisible(false)
  }

  return (
    <div className="container-lg">
      <Modal
        title="Confirm Request"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>The {clientRequest?.username} was request to host this room</p>
      </Modal>
      {
        console.log("currrrrrrrrrrr",currVideo)
      }
      <Row>
        <Col span={8} offset={4}>
          <h3>Current Host: {hostName}</h3>
          <Row gutter={[10,10]}><ReactPlayer
            ref={reactPlayerRef}
            playing={currVideo?.playing}
            url={currVideo?.url}
            onPause={() => handlePauseVideo()}
            onPlay={handlePlayVideo}
            played
            controls={isHost}
            onEnded={() => handleEndedVideo()}
            onSeek={(e) => handleOnSeek(e)}
            config={{
              youtube: {
                playerVars: {
                  start: currVideo?.time,
                },
              },
            }}
          /></Row>

          <Row gutter={[10,10]}>
            <Col span={6}><Button type="primary" disabled={queueVideo.length?false:true} onClick={() => (handleNextVideo())}><StepForwardOutlined /> NEXT</Button></Col>
            <Col span={10}><Button type="primary" disabled={isHost} onClick={() => handleRequestHost()} loading={requestLoading}>Request to host this room</Button></Col>
          </Row>

          <Search
            onChange={(e) => handleChangeYoutubeLink(e)}
            placeholder="Enter Youtube link"
            value={ytLink}
            enterButton="Add to Queue"
            onSearch={(e) => handleSubmitYoutubeLink(e)}
            style={{ width: 300, margin: 20 }}
          />

          <Slider arrows={true} cardsToShow={3} LeftArrow={<RightOutlined />}>
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
                  cover={<img alt="image" src={videoItem.img} />}
                  onClick={() => handleClickQueueVideo(videoItem, index)}
                  style={{ margin: 20 }}
                >
                  <Meta title={videoItem.title} />
                </Card>
              );
            })}
          </Slider>
        </Col>
        <Col span={12} justify="center">
          <Divider>Online Users</Divider>
          <Card title="" bordered={false} style={{ width: 300 }}>
            <div style={{ width: 600, height: 100, overflowY: "auto" }}>
              {users &&
                users.map((user, index) => (
                  <p key={index} className="font-weight-bold">
                    {user}
                  </p>
                ))}
            </div>
          </Card>
          <Divider>Chat room</Divider>
          <Card title="Messages" bordered={false}>
            <div style={{ width: 600, height: 400, overflowY: "auto" }}>
              {listMessage &&
                listMessage.map((message, index) => (
                  // <p key={index}>{message}</p>
                  <div
                    dangerouslySetInnerHTML={{ __html: message }}
                    key={index}
                  />
                ))}
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
            enterButton="Send"
            onSearch={(e) => handleSubmitMessage(e)}
          ></Search>
        </Col>
      </Row>
    </div>
  );
}
