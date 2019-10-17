import React from 'react';
import { OTSession, OTPublisher, OTStreams, OTSubscriber } from 'opentok-react';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.otPublisher = React.createRef();
    this.otSubscribers = [];

    this.state = {
      error: null,
      connection: 'Connecting',
      publishVideo: true,
      publisherStats: null,
      subscriberStatsArray: null
    };

    this.sessionEventHandlers = {
      sessionConnected: () => {
        this.setState({ connection: 'Connected' });
      },
      sessionDisconnected: () => {
        this.setState({ connection: 'Disconnected' });
      },
      sessionReconnected: () => {
        this.setState({ connection: 'Reconnected' });
      },
      sessionReconnecting: () => {
        this.setState({ connection: 'Reconnecting' });
      },
    };

    this.publisherEventHandlers = {
      accessDenied: () => {
        console.log('User denied access to media source');
      },
      streamCreated: () => {
        console.log('Publisher stream created');
      },
      streamDestroyed: ({ reason }) => {
        console.log(`Publisher stream destroyed because: ${reason}`);
      },
    };

    this.subscriberEventHandlers = {
      videoEnabled: () => {
        console.log('Subscriber video enabled');
      },
      videoDisabled: () => {
        console.log('Subscriber video disabled');
      },
    };

    setInterval(() => {

      this.otPublisher.current.getPublisher().getStats((err, stats) => {
        console.log('[opentok][publisher] stats[0].stats.audio :', stats[0].stats.audio);
        console.log('[opentok][publisher] stats[0].stats.video :', stats[0].stats.video);
      });

      this.otSubscribers.forEach(element => {
        element && element.getSubscriber().getStats((err, stats) => {
          console.log(`[opentok][subscriber ${element.subscriberId}] stats.audio :`, stats.audio);
          console.log(`[opentok][subscriber ${element.subscriberId}] stats.video :`, stats.video);
        });
      });

      const subscriberStatsArray = [];
      window.myPeerConnections.forEach((pc, index) => {
          if (pc.connectionState === 'closed') {
              pc.close();
              pc = null;
              window.myPeerConnections.splice(index, 1);
              console.log('Remove stale RTCPeerConnection');
              return;
          }
    
          if (pc.connectionState !== 'connected') {
              return;
          }

          switch (pc.localDescription.type) {
              case 'offer':
                // This RTCPeerConnection is published to OpenTok
                pc.isPublisher = true;
                this.setState({ publisherStats : pc.report });
                break;
              case 'answer':
                // This RTCPeerConnection is subscribed from OpenTok
                subscriberStatsArray.push(pc.report);
                break;
              default:
                console.log('Huh ?', pc);
                break;
          }

          this.setState({ subscriberStatsArray: subscriberStatsArray });
      })
    }, 5000);    
  }

  onSessionError = error => {
    this.setState({ error });
  };

  onPublish = () => {
    console.log('Publish Success');
  };

  onPublishError = error => {
    this.setState({ error });
  };

  onSubscribe = () => {
    console.log('Subscribe Success');
  };

  onSubscribeError = error => {
    this.setState({ error });
  };

  toggleVideo = () => {
    this.setState(state => ({
      publishVideo: !state.publishVideo,
    }));
  };

  render() {
    const { apiKey, sessionId, token } = this.props.credentials;
    const { error, connection, publishVideo, publisherStats, subscriberStatsArray } = this.state;
    return (
      <div>
        <div id="sessionStatus">Session Status: {connection}</div>
        {error ? (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}
        <OTSession
          apiKey={apiKey}
          sessionId={sessionId}
          token={token}
          onError={this.onSessionError}
          eventHandlers={this.sessionEventHandlers}
        >
          <button id="videoButton" onClick={this.toggleVideo}>
            {publishVideo ? 'Disable' : 'Enable'} Video
          </button>
          <OTPublisher
            ref={this.otPublisher}
            properties={{ publishVideo, width: 50, height: 50, }}
            onPublish={this.onPublish}
            onError={this.onPublishError}
            eventHandlers={this.publisherEventHandlers}
          />
          <OTStreams>
            <OTSubscriber
              ref={(ref) => {
                if (!ref) {
                  return;
                }

                if (this.otSubscribers.find((element) => {
                  return element.subscriberId === ref.subscriberId;
                })) {
                  return;
                }

                this.otSubscribers.push(ref);
              }}
              properties={{ width: 100, height: 100 }}
              onSubscribe={this.onSubscribe}
              onError={this.onSubscribeError}
              eventHandlers={this.subscriberEventHandlers}
            />
          </OTStreams>
        </OTSession>
        <div className='publisherStats'>
          <h3>Published stream</h3>
          {publisherStats ? (
            <div>
              <div> Inbound Audio Packets (received/lost): { publisherStats.inbound_rtp.audio.packetsReceived }/{ publisherStats.inbound_rtp.audio.packetsLost }</div>
              <div> Inbound Video packets (received/lost): { publisherStats.inbound_rtp.video.packetsReceived }/{ publisherStats.inbound_rtp.video.packetsLost }</div>
              <div> Outbound Audio Packets (sent/lost): { publisherStats.outbound_rtp.audio.packetsSent }/{ publisherStats.remote_inbound_rtp.audio.packetsLost }</div>
              <div> Outbound Video Packets (sent/lost): { publisherStats.outbound_rtp.video.packetsSent }/{ publisherStats.remote_inbound_rtp.video.packetsLost }</div>
              <div> Round Trip Time: { publisherStats.candidate_pair.currentRoundTripTime } sec</div>
            </div>
          ) : null}
        </div>
          <br/>

        <div className='subscribersStats'>
          <h3>All subscribed streams</h3>
          {subscriberStatsArray ? (
            <div>
              { subscriberStatsArray.map((subscriberStats, index) => {
                  return <div key={ index } >
                      <div> Inbound Audio Packets (received/lost): { subscriberStats.inbound_rtp.audio.packetsReceived }/{ subscriberStats.inbound_rtp.audio.packetsLost }</div>
                      <div> Inbound Video packets (received/lost): { subscriberStats.inbound_rtp.video.packetsReceived }/{ subscriberStats.inbound_rtp.video.packetsLost }</div>
                      <div> Outbound Audio Packets (sent/lost): { subscriberStats.outbound_rtp.audio.packetsSent }/{ subscriberStats.remote_inbound_rtp.audio.packetsLost }</div>
                      <div> Outbound Video Packets (sent/lost): { subscriberStats.outbound_rtp.video.packetsSent }/{ subscriberStats.remote_inbound_rtp.video.packetsLost }</div>
                      <div> Round Trip Time: { subscriberStats.candidate_pair.currentRoundTripTime } sec</div>
                      <br/>
                    </div>
                })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
