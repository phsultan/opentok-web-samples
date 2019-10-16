if (!Array.isArray(window.myPeerConnections)) {
    console.log('Initialising Array of PeerConnections');
    window.myPeerConnections = [];
}

let origPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

if (origPeerConnection) {
  console.log('I have a RTCPeerConnection object');
  let newPeerConnection = function (config, constraints) {
    const pc = new origPeerConnection(config, constraints);

    pc.continuousGetStats = () => {
        setTimeout(() => {
            if (!pc) {
                console.log('[continuousGetStats] No more pc, return');
                return;
            }

            pc.getStats().then(reports => {
                reports.forEach(report => {
                    switch (report.type) {
                        case 'outbound-rtp':
                            pc.report.outbound_rtp[report.mediaType].packetsSent = report.packetsSent;
                            pc.report.outbound_rtp[report.mediaType].retransmittedPacketsSent = report.retransmittedPacketsSent;
                            break;
                        case 'inbound-rtp':
                            pc.report.inbound_rtp[report.mediaType].packetsLost = report.packetsLost;
                            pc.report.inbound_rtp[report.mediaType].packetsReceived = report.packetsReceived;
                            break;
                        case 'remote-inbound-rtp':
                            pc.report.remote_inbound_rtp[report.kind].packetsLost = report.packetsLost;
                            pc.report.remote_inbound_rtp[report.kind].roundTripTime = report.roundTripTime;
                            break;
                        case 'candidate-pair':
                            pc.report.candidate_pair.currentRoundTripTime = report.currentRoundTripTime;
                            break;
                        default:
                            break;
                    }
                });
            }).catch((error) => {
                console.log('Error : ', error);
            });
        
            pc.continuousGetStats();
        }, 2000);
    }

    window.myPeerConnections.push(pc);

    pc.continuousGetStats();
    pc.report = {
        outbound_rtp : {
            audio : {

            },
            video : {

            }
        },
        inbound_rtp : {
            audio : {

            },
            video : {

            }
        },
        remote_inbound_rtp : {
            audio : {

            },
            video : {
                
            }
        },
        candidate_pair : {

        }
    };

    return pc;
  };

  ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection'].forEach(obj => {
    // Override objects if they exist in the window object
    if (window.hasOwnProperty(obj)) {
      window[obj] = newPeerConnection;

      // Copy the static methods (generateCertificate in this case)
      Object.keys(origPeerConnection).forEach(x => {
        window[obj][x] = origPeerConnection[x];
      });
      window[obj].prototype = origPeerConnection.prototype;
    }
  });
}

