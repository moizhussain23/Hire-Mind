import { useState, useRef, useCallback, useEffect } from 'react'

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: string) => void
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [connectionState, setConnectionState] = useState<string>('disconnected')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }, [])

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const peerConnection = new RTCPeerConnection(configuration)

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      setRemoteStream(remoteStream)
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
      
      options.onRemoteStream?.(remoteStream)
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState
      setConnectionState(state)
      setIsConnected(state === 'connected')
      options.onConnectionStateChange?.(state)
    }

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState)
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [options])

  // Start call
  const startCall = useCallback(async () => {
    try {
      const stream = await initializeLocalStream()
      const peerConnection = createPeerConnection()

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Create offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // In a real implementation, you would send the offer to the remote peer
      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsConnected(true)
        setConnectionState('connected')
      }, 1000)

    } catch (error) {
      console.error('Error starting call:', error)
      throw error
    }
  }, [initializeLocalStream, createPeerConnection])

  // End call
  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    if (remoteStream) {
      setRemoteStream(null)
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    setIsConnected(false)
    setConnectionState('disconnected')
  }, [localStream, remoteStream])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }, [localStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOn,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    initializeLocalStream
  }
}
