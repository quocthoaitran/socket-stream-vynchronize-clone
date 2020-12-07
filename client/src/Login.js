import React, { useEffect, useState } from "react"
import { useHistory } from "react-router-dom"
import { notification } from 'antd'

export default function Login({socket}) {
  const [username, setUsername] = useState('')
  const [roomID, setRoomID] = useState('')
  let history = useHistory()

  useEffect(() => {
    if (history.location.state && history.location.state.roomID) {
      setRoomID(history.location.state.roomID.split('/').slice(-1)[0])
    }
    return () => {
    }
  }, [])

  const randomRoom = () => {
    setRoomID(Math.random().toString(36).substr(2, 12))
  }

  const handleChangeUsername = (e) => {
    e.preventDefault();
    setUsername(e.target.value)
  }

  const handleRoomIDChange = (e) => {
    e.preventDefault();
    setRoomID(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username || !roomID) {
      notification['error']({
        message: 'Invalid data',
        description: 'Please enter a username or room ID',
        duration: 1
      })
      return
    }
    // Add user
    socket.emit('new_user', {username, roomID}, data => {
      if (data) {
        history.push(`/room/${data}`)
      }
    })
  }

  return (
    <div className="container">
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="form-group">
          <label>Enter Name</label>
          <input className="form-control" onChange={(e) => handleChangeUsername(e)} value={username}/>
          <label>Enter Room ID (Default 1)</label>
          <button type="button" onClick={() => randomRoom()} className="btn btn-primary random">Random</button>
          <input className="form-control" onChange={(e) => handleRoomIDChange(e)} value={roomID}/>
          <input type="submit" className="btn btn-primary" value="Enter" />
        </div>
    </form>
    </div>
  )
}
