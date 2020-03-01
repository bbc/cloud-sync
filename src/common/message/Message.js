var CloudSyncPacket = require("./CloudSyncPacket_pb"),
	CloudSyncMessage = require("./CloudSyncMessage_pb"),
	MessageIdGenerator = require("./MessageIdGenerator"),
	Correlation = require("./Correlation"),
	TimelineInfo = require("./TimelineInfo"),
	Timestamp = require("../timeline/Timestamp"),
	PresentationTimestamp = require("../timeline/PresentationTimestamp");
var Buffer = require("buffer").Buffer; // Buffer polyfill for browsers; otherwise uses NodeJS Buffer

var MessageType = {
	JOIN_REQ: 0,
	JOIN_RESP: 1,
	DEVICE_REQ: 2,
	DEVICE_RESP: 3,
	LEAVE_REQ: 4,
	LEAVE_RESP: 5,
	TIMELINE_REG_REQ: 6,
	TIMELINE_REG_RESP: 7,
	TIMELINE_DEREG_REQ: 8,
	TIMELINE_DEREG_RESP: 9,
	TIMELINE_REQ: 10,
	TIMELINE_QUERY: 11,
	TIMELINE_RESP: 12,
	TIMELINE_SUB_REQ: 13,
	TIMELINE_SUB_RESP: 14,
	TIMELINE_UPDATE_REQ: 15,
	TIMELINE_UPDATE_RESP: 16,
	STOP_TIMELINE_UPDATE_REQ: 17,
	TIMELINE_UPDATE: 18,
	CONTENT_ID_CHANGE: 19,
	DEVICE_STATUS: 20,
	UNEXPECTED_DEVICE_EXIT: 21,
	SYNC_TIMELINES_AVAIL: 22
  };
	
	
// -----------------------------------------------------------------------------
class Message
{
	constructor(msgType, sessionId, version, senderId, responseChannel, responseCode, msgId)
	{
		if ((typeof msgType === "undefined") ||
			(typeof sessionId == "undefined"))
			throw "Missing msgType or sessionId";
		
		this.messageType 	= msgType;
		this.sessionId 		= sessionId;
		this.id				= (typeof msgId === "undefined")? MessageIdGenerator.getNewId() : msgId;
		this.version		= (typeof version === "undefined")? "0.2.0" : version;

		if ((typeof senderId !=="undefined") && (senderId !== null) && (senderId!==""))
		{
			this.senderId 	= senderId;
		}
		
		if ((typeof responseChannel !=="undefined") && (responseChannel !== null) && (responseChannel!==""))
		{
			this.responseChannel 	= responseChannel;
		}

		if ((typeof responseCode !=="undefined") && (responseCode !== null))
		{
			this.responseCode 	= responseCode;
		}else
		{
			this.responseCode 	= 0;
		}

	}

	static deserialise(msg)
	{
		var binaryMsg = new Uint8Array(msg);

		// var binaryMsg = Base64.toByteArray(msg);
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		switch (header.getMsgtype()) {
			case proto.CloudSyncMessages.MessageType.JOIN_REQ:
				return JoinREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.JOIN_RESP:
				return JoinRESP.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.LEAVE_REQ:
				
				return LeaveREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.LEAVE_RESP:
			
				return LeaveRESP.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.STOP_TIMELINE_UPDATE_REQ:
				
				return StopTimelineUpdateREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_REQ:
			
				return TimelineDeregistrationREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_RESP:
			
				return TimelineDeregistrationRESP.deserialise(binaryMsg);

						
			case proto.CloudSyncMessages.MessageType.TIMELINE_END_SUB_RESP:
				// not implemented
			break;

			case proto.CloudSyncMessages.MessageType.TIMELINE_REG_REQ:
			
				return TimelineRegistrationREQ.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.TIMELINE_REG_RESP:
			
				return TimelineRegistrationRESP.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.TIMELINE_REQ:
			
				return TimelineREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.TIMELINE_RESP:
			
				return TimelineRESP.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.TIMELINE_SUB_REQ:
			
				return TimelineSubscriptionREQ.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.TIMELINE_SUB_RESP:
			
				return TimelineSubscriptionRESP.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_REQ:
				return TimelineUpdateREQ.deserialise(binaryMsg);
			break;
			
			case proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_RESP:
				return TimelineUpdateRESP.deserialise(binaryMsg);
			break;

			case proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE:
				return TimelineUpdate.deserialise(binaryMsg);
			break;

			case proto.CloudSyncMessages.MessageType.TIMELINE_QUERY:
			
				return TimelineQuery.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.DEVICE_REQ:
			
				return DeviceREQ.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.DEVICE_RESP:
			
				return DeviceRESP.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.CONTENT_ID_CHANGE:
		
				return ContentIdChange.deserialise(binaryMsg);

			case proto.CloudSyncMessages.MessageType.DEVICE_STATUS:
	
				return DeviceStatus.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.UNEXPECTED_DEVICE_EXIT:

				return UnexpectedDeviceExit.deserialise(binaryMsg);
			
			case proto.CloudSyncMessages.MessageType.SYNC_TIMELINES_AVAIL:

				return SyncTimelinesAvailable.deserialise(binaryMsg);
		
			default:
				break;
		}
	}
}

// -----------------------------------------------------------------------------

/**
 * Device registration request message.
 */
class JoinREQ extends Message
{

	constructor(sessionId, senderId, responseChannel, requestChannel, syncTLStrategy, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.JOIN_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((typeof senderId === "undefined") ||
			(typeof responseChannel === "undefined") ||
			(typeof syncTLStrategy === "undefined"))
			throw "Error: missing properties";

		this.requestChannel = ((typeof requestChannel === "undefined") || (requestChannel === null)) ? responseChannel : requestChannel;
		this.syncTLStrategy = syncTLStrategy;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.JOIN_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var joinREQMsg = new proto.CloudSyncMessages.JoinREQ();
		joinREQMsg.setRequestchannel(this.requestChannel);
		joinREQMsg.setSynctlstrategy(this.syncTLStrategy);

		var joinREQMsgBytes = joinREQMsg.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(joinREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());

		// console.log("JoinREQ.serialise() = " + typeof result );
		// var b64str = Base64.fromByteArray(packet.serializeBinary());

		return bytes;
	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a Join_REQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.JOIN_REQ)
		{
			throw "Not a JoinREQ message";
		}

		let payload = pbPacket.getPayload();

		let pbJoinREQ = proto.CloudSyncMessages.JoinREQ.deserializeBinary(payload);

		let syncTLStrategy = pbJoinREQ.getSynctlstrategy();


        if ((typeof syncTLStrategy === "undefined") || (syncTLStrategy === null ))
        {
            return null;
        }else
        {
			return new JoinREQ(header.getSessionid(), 
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbJoinREQ.getRequestchannel(), 
								syncTLStrategy,
								header.getMessageid(),
								header.getVersion());
        } 
	}

}

// -----------------------------------------------------------------------------
/**
 * Response message for a device registration. Contains WallClock service URL.
 */
class JoinRESP extends Message
{
	constructor(sessionId, responseCode, wallclockUrl, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.JOIN_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);

		if (typeof responseCode === "undefined") 
				throw "Error: missing reponsecode ";

		if ((typeof wallclockUrl !== "undefined") &&
			(wallclockUrl !== null) &&
			(wallclockUrl !== ""))
		{
			this.wallclockUrl = wallclockUrl;
		}
	
		
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.JOIN_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		if ((typeof this.responseChannel !=="undefined") && (this.responseChannel !== null))
		{
			msghdr.setResponsechannel(this.responseChannel);
		}
		
		msghdr.setResponsecode(this.responseCode);


		var joinRESPMsg = new proto.CloudSyncMessages.JoinRESP();
		
		if (typeof this.wallclockUrl !== "undefined")
		{
			joinRESPMsg.setWallclockurl(this.wallclockUrl);
		}

		var joinRESPMsgBytes = joinRESPMsg.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(joinRESPMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a Join_REQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.JOIN_RESP)
		{
			throw "Not a JoinRESP message";
		}

		let payload = pbPacket.getPayload();

		let pbJoinRESP = proto.CloudSyncMessages.JoinRESP.deserializeBinary(payload);
		let wallclockURL = pbJoinRESP.getWallclockurl();

        if ((typeof wallclockURL === "undefined") || (wallclockURL === null ) || (wallclockURL === ""))
        {
			console.error("Missing wallclockUrl.")
			return null;
        }else
        {
			return new JoinRESP(header.getSessionid(), 
								header.getResponsecode(),
								pbJoinRESP.getWallclockurl(),
								header.getMessageid(),
								header.getVersion()
								);
        } 
	}
}


// -----------------------------------------------------------------------------
/**
 * Request message to query the list of devices currently registered in the session.
 */
class DeviceREQ extends Message
{
	
	constructor(sessionId, senderId, responseChannel, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.DEVICE_REQ, sessionId, version, senderId, responseChannel, 0, msgId);
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.DEVICE_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a Join_REQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.DEVICE_REQ)
		{
			console.log("Not a DEVICE_REQ message.");
		}

		return new DeviceREQ(header.getSessionid(), 
							header.getSenderid(), 
							header.getResponsechannel(), 
							header.getMessageid(),
							header.getVersion());
         
	}
}



// ---------------------------------------------------------------------------
/**
 * Response message containing the results of a DeviceREQ query: a list of devices in the session.
 */
class DeviceRESP extends Message
{
	constructor(sessionId, responseCode, devices, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.DEVICE_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);

		if ((typeof devices !== "undefined") || (devices !== null))
			this.devices = devices;
		else
			this.devices = [];
		
		if (typeof responseCode === "undefined") 
				throw "Error: missing responseCode ";
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.DEVICE_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		if ((typeof this.responseChannel !=="undefined") && (this.responseChannel !== null))
		{
			msghdr.setResponsechannel(this.responseChannel);
		}
		
		msghdr.setResponsecode(this.responseCode);


		var deviceRESPMsg = new proto.CloudSyncMessages.DeviceRESP();

		deviceRESPMsg.setDevicesList(this.devices);

		var deviceRESPMsgBytes = deviceRESPMsg.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(deviceRESPMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a DEVICE_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.DEVICE_RESP)
		{
			console.log("Not a DEVICE_RESP message");
		}

		let payload = pbPacket.getPayload();

		let pbDeviceRESP = proto.CloudSyncMessages.DeviceRESP.deserializeBinary(payload);

		let deviceList = pbDeviceRESP.getDevicesList();

        if ((typeof deviceList === "undefined") || (deviceList === null ))
        {
            return null;
        }else
        {
			return new DeviceRESP(header.getSessionid(), 
								header.getResponsecode(),
								deviceList,
								header.getMessageid(),
								header.getVersion()
								);

        } 
	}
}


// -----------------------------------------------------------------------------
/**
 * Message sent by a device before it leaves a session. (Optional)
 */
class LeaveREQ extends Message
{
	constructor(sessionId, senderId, responseChannel, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.LEAVE_REQ, sessionId, version, senderId, responseChannel, 0, msgId);
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.LEAVE_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		if ((typeof this.responseChannel !=="undefined") && (this.responseChannel !== null))
		{
			msghdr.setResponsechannel(this.responseChannel);
		}

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * Deserialise binary message using Protocol Buffers
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a Leave_REQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.LEAVE_REQ)
		{
			console.log("Not a LEAVE_REQ message.");
		}

		return new LeaveREQ(header.getSessionid(), 
							header.getSenderid(), 
							header.getResponsechannel(), 
							header.getMessageid(),
							header.getVersion());
         
	}
}



// -----------------------------------------------------------------------------

/**
 * Response message sent to sender of a LeaveREQ message.
 */
class LeaveRESP extends Message
{
	constructor(sessionId, responseCode, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.LEAVE_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.LEAVE_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		if ((typeof this.responseChannel !=="undefined") && (this.responseChannel !== null))
		{
			msghdr.setResponsechannel(this.responseChannel);
		}
		
		msghdr.setResponsecode(this.responseCode);

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a DEVICE_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.LEAVE_RESP)
		{
			console.log("Not a LEAVE_RESP message");
		}

		return new LeaveRESP(header.getSessionid(), 
							header.getResponsecode(),
							header.getMessageid(),
							header.getVersion()
							);

       
	}
}

// -----------------------------------------------------------------------------

class TimelineRegistrationREQ extends Message
{
	constructor(sessionId, senderId, responseChannel, timelineId, contentId, timelineType, frequency, channel, correlation, useForSessionSync, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_REG_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((typeof timelineId === "undefined") || 
			(typeof timelineType === "undefined"))
			throw "Missing timelineId or  timelineType parameter";

		this.timelineId = timelineId;
		if ((typeof contentId !== "undefined") && ( contentId !== null) && (contentId !== ""))
		{
			this.contentId = contentId;
		}
		
		this.timelineType = timelineType;
		this.frequency = frequency;
		this.channel = channel;

		if ((correlation !=="undefined") && (correlation !== null))
		{
			this.correlation = correlation;
		}	

		this.useForSessionSync = ((useForSessionSync ==="undefined") || (useForSessionSync === null)) ? false : useForSessionSync;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_REG_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);

		var  pbREQMsg = new proto.CloudSyncMessages.TimelineRegistrationREQ();
		pbREQMsg.setTimelineid(this.timelineId);
		if ((typeof this.contentId !== "undefined") && ( this.contentId !== null))
		{
			pbREQMsg.setContentid(this.contentId);
		}
		
		pbREQMsg.setTimelinetype(this.timelineType);
		pbREQMsg.setChannel(this.channel);
		pbREQMsg.setFrequency(this.frequency);

		if ((typeof this.correlation !== "undefined") && (this.correlation !== null))
		{
			var corr = new proto.CloudSyncMessages.Correlation();
			corr.setParenttime(this.correlation.parentTime);
			corr.setChildtime(this.correlation.childTime);
			if (typeof this.correlation.initialError !== "undefined")
			{
				corr.setInitialerror(this.correlation.initialError);
			}
			if (typeof this.correlation.errorGrowthRate !== "undefined")
			{
				corr.setErrorgrowthrate(this.correlation.errorGrowthRate);
			}
		
			pbREQMsg.setCorrelation(corr);
		}
		pbREQMsg.setUseforsessionsync(this.useForSessionSync);

		var pbREQMsgBytes = pbREQMsg.serializeBinary();

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(pbREQMsgBytes);
		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a StopTimelineUpdateREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_REG_REQ)
		{
			console.log("Not a TIMELINE_REG_REQ message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineRegistrationREQ.deserializeBinary(payload);
		let pbCorr = pbREQ.getCorrelation();
		let corr = null;

		if ((pbCorr !== null) && (typeof pbCorr !== "undefined"))
		{
			corr = new Correlation(pbCorr.getParenttime(), pbCorr.getChildtime(), pbCorr.getInitialerror(), pbCorr.getErrorgrowthrate());
		}



		return new TimelineRegistrationREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getTimelineid(),
								pbREQ.getContentid(),
								pbREQ.getTimelinetype(),
								pbREQ.getFrequency(),
								pbREQ.getChannel(),
								corr,
								pbREQ.getUseforsessionsync(),								
								header.getMessageid(),
								header.getVersion());

		

		
	}

}


// -----------------------------------------------------------------------------

class TimelineRegistrationRESP extends Message
{

	constructor(sessionId, responseCode, timelineUpdateChannel, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_REG_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);
		
		if ((typeof responseCode === "undefined") || (responseCode === null))
			throw "Missing responseCode parameter";
		
		if ((typeof timelineUpdateChannel !== "undefined") && (timelineUpdateChannel !== null) && (timelineUpdateChannel !== ""))
			this.timelineUpdateChannel =  timelineUpdateChannel;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		// packet header
		var msghdr = new proto.CloudSyncMessages.Header();
		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_REG_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		
		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}
		
		msghdr.setResponsecode(this.responseCode);

		// packet payload
		var  payload = new proto.CloudSyncMessages.TimelineRegistrationRESP();

		if ((typeof this.timelineUpdateChannel !=="undefined") && (this.timelineUpdateChannel !== null) )
		{
			payload.setTimelineupdatechannel(this.timelineUpdateChannel);
		}

		var payloadAsBytes = payload.serializeBinary();

		// create packet
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TIMELINE_REG_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_REG_RESP)
		{
			console.Error("Not a TIMELINE_REG_RESP message");
		}

		let payload = pbPacket.getPayload();
		let pbRESP = proto.CloudSyncMessages.TimelineRegistrationRESP.deserializeBinary(payload);

		return new TimelineRegistrationRESP(header.getSessionid(), 
							header.getResponsecode(),
							pbRESP.getTimelineupdatechannel(),
							header.getMessageid(),
							header.getVersion()
							);
       
	}

}


// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
/**
 * Request message to unregister a timeline
 */
class TimelineDeregistrationREQ extends Message
{

	constructor(sessionId, senderId, responseChannel, timelineId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((typeof timelineId === "undefined") || (timelineId === null))
			throw "Missing timelineId parameter";
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  pbREQMsg = new proto.CloudSyncMessages.TimelineDeregistrationREQ();
		pbREQMsg.setTimelineid(this.timelineId);
		

		var pbREQMsgBytes = pbREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(pbREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a StopTimelineUpdateREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_REQ)
		{
			console.log("Not a TIMELINE_DEREG_REQ message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineDeregistrationREQ.deserializeBinary(payload);

		return new TimelineDeregistrationREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getTimelineid(),
								header.getMessageid(),
								header.getVersion());
         
	}

}


// -----------------------------------------------------------------------------

class TimelineDeregistrationRESP extends Message
{

	constructor(sessionId, responseCode, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);
		if ((typeof responseCode === "undefined") || (responseCode === null))
			throw "Missing responseCode parameter";
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		
		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		if ((typeof this.responseChannel !=="undefined") && (this.responseChannel !== null))
		{
			msghdr.setResponsechannel(this.responseChannel);
		}
		
		msghdr.setResponsecode(this.responseCode);

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TIMELINE_DEREG_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_DEREG_RESP)
		{
			console.log("Not a TIMELINE_DEREG_RESP message");
		}

		return new TimelineDeregistrationRESP(header.getSessionid(), 
							header.getResponsecode(),
							header.getMessageid(),
							header.getVersion()
							);
       
	}

}



// -----------------------------------------------------------------------------

/**
 * Query for resgistered timelines in a session
 */
class TimelineREQ extends Message
{
	constructor(sessionId, senderId, responseChannel, syncTimeline, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((syncTimeline !=="undefined") && (syncTimeline !== null))
		{
			this.syncTimeline = syncTimeline;
		}
		else
		{
			this.syncTimeline = false;
		}		
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  pbREQMsg = new proto.CloudSyncMessages.TimelineREQ();
		if (typeof this.syncTimeline !== "undefined") 
			pbREQMsg.setSynctimeline(this.syncTimeline);

		var pbREQMsgBytes = pbREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(pbREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_REQ)
		{
			console.error("Not a timelineType message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineREQ.deserializeBinary(payload);
		
		return new TimelineREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getSynctimeline(),
								header.getMessageid(),
								header.getVersion());
	}

}

// -----------------------------------------------------------------------------

/**
 * Query for resgistered timelines in a session
 */
class TimelineQuery extends Message
{
	constructor(sessionId, senderId, responseChannel, providerId, contentId, timelineType, syncTimeline, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_QUERY, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((providerId !=="undefined") && (providerId !== null) && (providerId !== ""))
		{
			this.providerId = providerId;
		}		
		if ((contentId !=="undefined") && (contentId !== null) && (contentId!== ""))
		{
			this.contentId = contentId;
		}
		if ((timelineType !=="undefined") && (timelineType !== null) && (timelineType!==""))
		{
			this.timelineType = timelineType;
		}
		
		if ((syncTimeline !=="undefined") && (syncTimeline !== null))
		{
			this.syncTimeline = syncTimeline;
		}else
			this.syncTimeline = false;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_QUERY);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  pbREQMsg = new proto.CloudSyncMessages.TimelineQuery();
		if (typeof this.providerId !== "undefined") 
			pbREQMsg.setProviderid(this.providerId);

		if (typeof this.contentId !== "undefined") 
			pbREQMsg.setContentid(this.contentId);

		if (typeof this.timelineType !== "undefined") 
			pbREQMsg.setTimelinetype(this.timelineType);
		
		pbREQMsg.setSynctimeline(this.syncTimeline);
		
		var pbREQMsgBytes = pbREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(pbREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineQuery
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_QUERY)
		{
			console.error("Not a TIMELINE_QUERY message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineQuery.deserializeBinary(payload);
		
		return new TimelineQuery(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getProviderid(),
								pbREQ.getContentid(),
								pbREQ.getTimelinetype(),
								pbREQ.getSynctimeline(),
								header.getMessageid(),
								header.getVersion());
	}

}


// -----------------------------------------------------------------------------

class TimelineRESP extends Message
{

	constructor(sessionId, responseCode, timelineInfoArray, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);
		
		if ((typeof timelineInfoArray !== undefined) && (timelineInfoArray !== null))
		{
			if (Array.isArray(timelineInfoArray))
			{
				if (timelineInfoArray.length > 0)
				{
					if (!timelineInfoArray[0].hasOwnProperty("timelineId"))
					{
						throw "timelineInfoArray does not contain TimelineInfo objects.";
					}
				}
			
				this.timelineInfoArray =  timelineInfoArray;
			}

		}else{
			this.timelineInfoArray = [];
		}			
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		// packet header
		var msghdr = new proto.CloudSyncMessages.Header();
		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		
		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}
		
		msghdr.setResponsecode(this.responseCode);

		// packet payload
		var  payload = new proto.CloudSyncMessages.TimelineRESP();
		
		this.timelineInfoArray.forEach(obj => {

			let pbTlInfo = new proto.CloudSyncMessages.TimelineInfo();

			var timelineId = (typeof obj.timelineId !== "undefined") ? obj.timelineId : obj.id;

			pbTlInfo.setTimelineid(timelineId);
			pbTlInfo.setTimelinetype(obj.timelineType);
			if (typeof obj.contentId !== "undefined") pbTlInfo.setContentid(obj.contentId);
			if (typeof obj.frequency !== "undefined") pbTlInfo.setFrequency(obj.frequency);
			if (typeof obj.channel !== "undefined") pbTlInfo.setChannel(obj.channel);
			if (typeof obj.providerId !== "undefined") pbTlInfo.setProviderid(obj.providerId);
			if (typeof obj.providerType !== "undefined") pbTlInfo.setProvidertype(obj.providerType);

			if ((typeof obj.parentTL !== "undefined") && (obj.parentTL !== null)) pbTlInfo.setParenttimelineid(obj.parentTL);

			if ((typeof obj.parentTLCorr !== "undefined") && (obj.parentTLCorr !== null))
			{	
				var corr = new proto.CloudSyncMessages.Correlation();
				corr.setParenttime(obj.parentTLCorr.parentTime);
				corr.setChildtime(obj.parentTLCorr.childTime);
				if (typeof obj.parentTLCorr.initialError !== "undefined")
				{
					corr.setInitialerror(obj.parentTLCorr.initialError);
				}
				if (typeof obj.parentTLCorr.errorGrowthRate !== "undefined")
				{
					corr.setErrorgrowthrate(obj.parentTLCorr.errorGrowthRate);
				}
				
				pbTlInfo.setParentcorrelation(corr);
			} 
			
			if ((typeof obj.lastTimestamp !== "undefined") && (obj.lastTimestamp !== null))
			{
				pbTlInfo.setLasttimestamp(TimelineSubscriptionRESP.protoTimestampFromTimestamp(obj.lastTimestamp));
			}
			

			payload.addTimelineinfo(pbTlInfo);
		});

		var payloadAsBytes = payload.serializeBinary();

		// create packet
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TIMELINE_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_RESP)
		{
			throw "Not a TIMELINE_RESP message";
		}

		let payload = pbPacket.getPayload();
		let pbRESP = proto.CloudSyncMessages.TimelineRESP.deserializeBinary(payload);

		let listOfTimelines = [];
		let timelineInfoList = pbRESP.getTimelineinfoList();

		if ((Array.isArray(timelineInfoList)) && (timelineInfoList.length > 0) )
		{
			timelineInfoList.forEach(tl => {

				let pbCorr = tl.getParentcorrelation();
				let corr = null;

				if ((pbCorr !== null) && (typeof pbCorr !== "undefined"))
				{
					corr = new Correlation(pbCorr.getParenttime(), pbCorr.getChildtime(), pbCorr.getInitialerror(), pbCorr.getErrorgrowthrate());
				}

				listOfTimelines.push(new TimelineInfo(tl.getTimelineid(),
					tl.getTimelinetype(),
					tl.getContentid(),
					tl.getFrequency(),
					tl.getChannel(),
					tl.getProviderid(),
					tl.getProvidertype(),
					tl.getParenttimelineid(),
					corr,
					TimelineSubscriptionRESP.timestampFromProtoTimestamp(tl.getLasttimestamp())
					)
				);
			});	
		}

		return new TimelineRESP(header.getSessionid(), 
							header.getResponsecode(),
							listOfTimelines,
							header.getMessageid(),
							header.getVersion()
							);
       
	}

}


// -----------------------------------------------------------------------------
class TimelineSubscriptionREQ extends Message
{
	/**
	 * Constructor
	 * @param {string} sessionId 
	 * @param {string} senderId 
	 * @param {string} responseChannel 
	 * @param {string} timelineId 
	 * @param {string} msgId 
	 * @param {string} version 
	 */
	constructor(sessionId, senderId, responseChannel, timelineId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_SUB_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((senderId ==="undefined") || (senderId === null) || (senderId === ""))
		{
			throw "Error: valid senderId parameter required.";
		}

		if ((timelineId ==="undefined") || (timelineId === null) || (timelineId === ""))
		{
			throw "Error: valid timelineId parameter required.";
		}
		else
		{ 
			this.timelineId = timelineId;
		}
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_SUB_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  pbREQMsg = new proto.CloudSyncMessages.TimelineSubscriptionREQ();
		pbREQMsg.setTimelineid(this.timelineId);

		
		var pbREQMsgBytes = pbREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(pbREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * Deserialise byte array into a TimelineSubscriptionREQ object
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TIMELINE_SUB_REQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_SUB_REQ)
		{
			console.error("Not a TIMELINE_SUB_REQ message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineSubscriptionREQ.deserializeBinary(payload);
		
		return new TimelineSubscriptionREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getTimelineid(),
								header.getMessageid(),
								header.getVersion());
	}

}


// -----------------------------------------------------------------------------

class TimelineSubscriptionRESP extends Message
{
	/**
	 * TimelineSubscriptionRESP constructor
	 * @param {string} sessionId 
	 * @param {number} responseCode 
	 * @param {string} providerChannel 
	 * @param {PresentationTimestamp} presentationTimestamp 
	 * @param {string} msgId 
	 * @param {string} version 
	 */
	constructor(sessionId, responseCode, timeline, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_SUB_RESP, sessionId, version, "cloud-sync", null, responseCode, msgId);
		
		if ((timeline !=="undefined") && (timeline !== null))
		{
			this.timeline = timeline;
		}
	
	}

		/**
	 * Create a proto.CloudSyncMessages.Timestamp object from a Timestamp object
	 * @param {Timestamp} timestamp 
	 */
	static protoTimestampFromTimestamp(timestamp)
	{

		if ((timestamp === null) || (typeof timestamp.contentTime === "undefined"))
			return null;
		
		let proto_ts = new proto.CloudSyncMessages.Timestamp();

		proto_ts.setContenttime(timestamp.contentTime);
		proto_ts.setWallclocktime(timestamp.wallclockTime);
		proto_ts.setSpeed(timestamp.speed);

		return proto_ts;
	}

	/**
	 * create a proto.CloudSyncMessages.PresentationTimestamp object from a PresentationTimestamp object
	 * @param {PresentationTimestamp} pts 
	 */
	static protoPresentationTimestampFromPTS(pts)
	{
		
		if ((pts === null) || (typeof pts.actual === "undefined"))
			return null;

		let proto_pts = new proto.CloudSyncMessages.PresentationTimestamp();
		
		let actualTS = TimelineSubscriptionRESP.protoTimestampFromTimestamp(pts.actual);
		proto_pts.setActual(actualTS);

		if ((typeof pts.earliest !== "undefined") && (pts.earliest !== null))
		{
			let earliestTS = TimelineSubscriptionRESP.protoTimestampFromTimestamp(pts.earliest);
			if (earliestTS !==null)
				proto_pts.setEarliest(earliestTS);
		}
		if ((typeof pts.latest !== "undefined") && (pts.latest !== null))
		{
			let latestTS = TimelineSubscriptionRESP.protoTimestampFromTimestamp(pts.latest);
			if (latestTS !==null)
				proto_pts.setLatest(latestTS);
		}

		return proto_pts;
	}

	static protoTimelineInfoFromTimeline(timeline)
	{
				
		var pbTlInfo = new proto.CloudSyncMessages.TimelineInfo();

		var timelineId = (typeof timeline.timelineId !== "undefined") ? timeline.timelineId : timeline.id;

		pbTlInfo.setTimelineid(timelineId);
		pbTlInfo.setTimelinetype(timeline.timelineType);
		if (typeof timeline.contentId !== "undefined") pbTlInfo.setContentid(timeline.contentId);
		if (typeof timeline.frequency !== "undefined") pbTlInfo.setFrequency(timeline.frequency);
		if (typeof timeline.channel !== "undefined") pbTlInfo.setChannel(timeline.channel);
		if (typeof timeline.providerId !== "undefined") pbTlInfo.setProviderid(timeline.providerId);
		if (typeof timeline.providerType !== "undefined") pbTlInfo.setProvidertype(timeline.providerType);

		if ((typeof timeline.parentTL !== "undefined") && (timeline.parentTL !== null)) pbTlInfo.setParenttimelineid(timeline.parentTL);

		if ((typeof timeline.parentTLCorr !== "undefined") && (timeline.parentTLCorr !== null))
		{	
			var corr = new proto.CloudSyncMessages.Correlation();
			corr.setParenttime(timeline.parentTLCorr.parentTime);
			corr.setChildtime(timeline.parentTLCorr.childTime);
			if (typeof timeline.parentTLCorr.initialError !== "undefined")
			{
				corr.setInitialerror(timeline.parentTLCorr.initialError);
			}
			if (typeof timeline.parentTLCorr.errorGrowthRate !== "undefined")
			{
				corr.setErrorgrowthrate(timeline.parentTLCorr.errorGrowthRate);
			}
			
			pbTlInfo.setParentcorrelation(corr);
		} 
		
		if ((typeof timeline.lastTimestamp !== "undefined") && (timeline.lastTimestamp !== null))
		{
			pbTlInfo.setLasttimestamp(TimelineSubscriptionRESP.protoTimestampFromTimestamp(timeline.lastTimestamp));
		}
		return pbTlInfo;
	}


	static timelineFromprotoTimelineInfo(pbTlInfo)
	{
		if ((typeof pbTlInfo === "undefined") && (pbTlInfo === null))
			return null;
		
		let pbCorr = pbTlInfo.getParentcorrelation();
		let corr = null;

		if ((pbCorr !== null) && (typeof pbCorr !== "undefined"))
		{
			corr = new Correlation(pbCorr.getParenttime(), pbCorr.getChildtime(), pbCorr.getInitialerror(), pbCorr.getErrorgrowthrate());
		}

		let timeline =  new TimelineInfo(pbTlInfo.getTimelineid(),
			pbTlInfo.getTimelinetype(),
			pbTlInfo.getContentid(),
			pbTlInfo.getFrequency(),
			pbTlInfo.getChannel(),
			pbTlInfo.getProviderid(),
			pbTlInfo.getProvidertype(),
			pbTlInfo.getParenttimelineid(),
			corr,
			TimelineSubscriptionRESP.timestampFromProtoTimestamp(pbTlInfo.getLasttimestamp())
			);
		
			
		
		return timeline;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		// packet header
		var msghdr = new proto.CloudSyncMessages.Header();
		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_SUB_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		
		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}
		
		msghdr.setResponsecode(this.responseCode);

		// packet payload
		var  payload = new proto.CloudSyncMessages.TimelineSubscriptionRESP();
		
		
		if ((typeof this.timeline !=="undefined") && (this.timeline !== null))
		{
			payload.setTimeline(TimelineSubscriptionRESP.protoTimelineInfoFromTimeline(this.timeline));
		}
		
		var payloadAsBytes = payload.serializeBinary();

		// create packet
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * Convert a (protobuf) proto.CloudSyncMessages.Timestamp object to a plain old Timestamp object.
	 * @param {proto.CloudSyncMessages.Timestamp} protoTimestamp 
	 */
	static timestampFromProtoTimestamp(protoTimestamp)
	{

		if ((protoTimestamp === null) || (typeof protoTimestamp === "undefined"))
			return null;
		
		if ((typeof protoTimestamp.getContenttime !== "function") ||
			(typeof protoTimestamp.getWallclocktime !== "function") ||
			(typeof protoTimestamp.getSpeed !== "function"))
			return  null;

		return new Timestamp(protoTimestamp.getContenttime(), protoTimestamp.getWallclocktime(), protoTimestamp.getSpeed());
	}

	static presentationTimestampFromProtoPTS(pbPTS)
	{
		if ((pbPTS === null) || (typeof pbPTS === "undefined"))
			return null;
		
		if ((typeof pbPTS.getEarliest !== "function") ||
			(typeof pbPTS.getActual !== "function") ||
			(typeof pbPTS.getLatest !== "function"))
			return  null;

		let pbEarliest = pbPTS.getEarliest(), pbActual = pbPTS.getActual(), pbLatest = pbPTS.getLatest();

		let timeObj = {
			earliest : TimelineSubscriptionRESP.timestampFromProtoTimestamp(pbEarliest),
			actual: TimelineSubscriptionRESP.timestampFromProtoTimestamp(pbActual),
			latest: TimelineSubscriptionRESP.timestampFromProtoTimestamp(pbLatest)
		}

		return new PresentationTimestamp(timeObj);
	}


	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TIMELINE_RESP
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_SUB_RESP)
		{
			throw "Not a TIMELINE_SUB_RESP message";
		}

		let payload = pbPacket.getPayload();
		let pbRESP = proto.CloudSyncMessages.TimelineSubscriptionRESP.deserializeBinary(payload);

		
		let timeline = TimelineSubscriptionRESP.timelineFromprotoTimelineInfo(pbRESP.getTimeline());
		
		return new TimelineSubscriptionRESP(header.getSessionid(),
											header.getResponsecode(),
											timeline,
											header.getMessageid(),
											header.getVersion());
	}
}

// -----------------------------------------------------------------------------

/**
 * Message to request device to send timeline updates (Correlation Timestamps)
 */
class TimelineUpdateREQ extends Message
{

	constructor(sessionId, senderId, responseChannel, timelineId, timelineType, contentId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		if ((timelineId !=="undefined") && (timelineId !== null) && (timelineId !== ""))
		{
			this.timelineId = timelineId;
		}		
		if ((timelineType !=="undefined") && (timelineType !== null) && (timelineType!== ""))
		{
			this.timelineType = timelineType;
		}
		if ((contentId !=="undefined") && (contentId !== null) && (contentId!==""))
		{
			this.contentId = contentId;
		}
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  tlUpdateREQMsg = new proto.CloudSyncMessages.TimelineUpdateREQ();
		if (this.timelineId !=="undefined") tlUpdateREQMsg.setTimelineid(this.timelineId);
		if (this.timelineType !=="undefined") tlUpdateREQMsg.setTimelinetype(this.timelineType);
		if (this.contentId !=="undefined") tlUpdateREQMsg.setContentid(this.contentId);
		

		var tlUpdateREQMsgBytes = tlUpdateREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(tlUpdateREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineUpdateREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TimelineUpdateREQ)
		{
			console.log("Not a TimelineUpdateREQ message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.TimelineUpdateREQ.deserializeBinary(payload);

		return new TimelineUpdateREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getTimelineid(),
								pbREQ.getTimelinetype(),
								pbREQ.getContentid(),
								header.getMessageid(),
								header.getVersion());
         
	}

}

// -----------------------------------------------------------------------------
/**
 * Response message for a device registration. Contains WallClock service URL.
 */
class TimelineUpdateRESP extends Message
{
	constructor(sessionId, senderId, responseCode, timelineId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_RESP, sessionId, version, senderId, null, responseCode, msgId);

		if ((typeof timelineId !== "undefined") && (timelineId !== null) && (timelineId !== ""))
			this.timelineId = timelineId;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_RESP);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}
			
		msghdr.setResponsecode(this.responseCode);

		var resp = new proto.CloudSyncMessages.TimelineUpdateRESP();
		if (typeof this.timelineId !== "undefined")
		{
			resp.setTimelineid(this.timelineId);
		}
		
		var respMsgBytes = resp.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(respMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineUpdateResp
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE_RESP)
		{
			throw "Not a TIMELINE_UPDATE_RESP message";
		}

		let payload = pbPacket.getPayload();

		let pbRESP = proto.CloudSyncMessages.TimelineUpdateRESP.deserializeBinary(payload);
		
		return new TimelineUpdateRESP(header.getSessionid(),
							header.getSenderid(),
							header.getResponsecode(),
							pbRESP.getTimelineid(),
							header.getMessageid(),
							header.getVersion()
							);
    	}
}


// -----------------------------------------------------------------------------

/**
 * Message to stop a device sending timeline updates (Correlation Timestamps)
 */
class StopTimelineUpdateREQ extends Message
{

	constructor(sessionId, senderId, responseChannel, timelineId, timelineType, contentId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.STOP_TIMELINE_UPDATE_REQ, sessionId, version, senderId, responseChannel, 0, msgId);

		this.timelineId = timelineId;
		this.timelineType = timelineType;
		this.contentId = contentId;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.STOP_TIMELINE_UPDATE_REQ);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setResponsechannel(this.responseChannel);


		var  stopTLUpdateREQMsg = new proto.CloudSyncMessages.StopTimelineUpdateREQ();
		stopTLUpdateREQMsg.setTimelineid(this.timelineId);
		stopTLUpdateREQMsg.setTimelinetype(this.timelineType);
		stopTLUpdateREQMsg.setContentid(this.contentId);
		

		var stopTLUpdateREQMsgBytes = stopTLUpdateREQMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(stopTLUpdateREQMsgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a StopTimelineUpdateREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.STOP_TIMELINE_UPDATE_REQ)
		{
			console.log("Not a STOP_TIMELINE_UPDATE_REQ message");
		}

		let payload = pbPacket.getPayload();

		let pbREQ = proto.CloudSyncMessages.StopTimelineUpdateREQ.deserializeBinary(payload);

		return new StopTimelineUpdateREQ(header.getSessionid(),
								header.getSenderid(), 
								header.getResponsechannel(), 
								pbREQ.getTimelineid(),
								pbREQ.getTimelinetype(),
								pbREQ.getContentid(),
								header.getMessageid(),
								header.getVersion());
         
	}

}



// -----------------------------------------------------------------------------

/**
 * Message to report a content change on a device.
 */
class ContentIdChange extends Message
{

	constructor(sessionId, senderId, contentId, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.CONTENT_ID_CHANGE, sessionId, version, senderId, null, 0, msgId);

		this.contentId = contentId;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.CONTENT_ID_CHANGE);
		msghdr.setSessionid(this.sessionId);
		msghdr.setSenderid(this.senderId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		var  contentIdChangeMsg = new proto.CloudSyncMessages.ContentIDChange();
		contentIdChangeMsg.setContentid(this.contentId);
		

		var msgBytes = contentIdChangeMsg.serializeBinary();
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(msgBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {*} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a StopTimelineUpdateREQ
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.CONTENT_ID_CHANGE)
		{
			console.log("Not a CONTENT_ID_CHANGE message");
		}

		let payload = pbPacket.getPayload();

		let pbMsg = proto.CloudSyncMessages.ContentIDChange.deserializeBinary(payload);

		return new ContentIdChange(header.getSessionid(),
								header.getSenderid(), 
								pbMsg.getContentid(),
								header.getMessageid(),
								header.getVersion());
         
	}

}


// -----------------------------------------------------------------------------

/**
 * A timeline progress update specifying position on the timeline as a Presentation Timestamp object
 * (a pair of timestamps and a speed value)
 */
class TimelineUpdate extends Message
{
	constructor(sessionId, senderId, timelineId, timelineType, contentId, presentationTimestamp, msgId, version)
	{
		super(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE, sessionId, version, senderId, null, 0, msgId);

		if ((typeof timelineId === "undefined") || 
		(typeof presentationTimestamp === "undefined"))
		{
			throw "timelineId and presentationTimestamp arguments required";
		}

		if (!PresentationTimestamp.isPresentationTimestampObject(presentationTimestamp))
		throw "Invalid  presentationTimestamp argument.";

		this.timelineId = timelineId;
		this.presentationTimestamp =  presentationTimestamp;
		
		if ((typeof timelineType !== "undefined") && (timelineType !== null))
			this.timelineType = timelineType;
		
		if ((typeof contentId !== "undefined") && (contentId !== null))
			this.contentId = contentId;

	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);

		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		var payload = new proto.CloudSyncMessages.TimelineUpdate();
		payload.setTimelineid(this.timelineId);

		if ((typeof this.contentId !== "undefined") && (this.contentId !== null))
		{
			payload.setContentid(this.contentId);
		}

		if ((typeof this.timelineType !== "undefined") && (this.timelineType !== null))
		{
			payload.setTimelinetype(this.timelineType);
		}

		if ((typeof this.presentationTimestamp !== "undefined") && (this.presentationTimestamp !== null))
		{
			payload.setPresentationtimestamp( TimelineSubscriptionRESP.protoPresentationTimestampFromPTS(this.presentationTimestamp));
		}	

		var payloadAsBytes = payload.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;


	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineUpdateResp
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.TIMELINE_UPDATE)
		{
			throw "Not a TIMELINE_UPDATE message";
		}

		let payload = pbPacket.getPayload();

		let pbPayload = proto.CloudSyncMessages.TimelineUpdate.deserializeBinary(payload);


		let pb_pts = pbPayload.getPresentationtimestamp();

		return new TimelineUpdate(header.getSessionid(),
									header.getSenderid(),
									pbPayload.getTimelineid(),
									pbPayload.getTimelinetype(),
									pbPayload.getContentid(),
									TimelineSubscriptionRESP.presentationTimestampFromProtoPTS(pb_pts),
									header.getMessageid(),
									header.getVersion());		
    }
}

// -----------------------------------------------------------------------------

class DeviceStatus extends Message
{

	constructor(sessionId, senderId, deviceId, status)
	{
		super(proto.CloudSyncMessages.MessageType.DEVICE_STATUS, sessionId, "0.2.0", senderId)

		this.deviceId = deviceId;
		this.status = status;
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.DEVICE_STATUS);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setSenderid(this.senderId);

		var payload = new proto.CloudSyncMessages.DeviceStatus();
		payload.setDevice(this.deviceId);
		payload.setStatus(this.status);

		var payloadAsBytes = payload.serializeBinary();		

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineUpdateResp
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.DEVICE_STATUS)
		{
			throw "Not a DEVICE_STATUS message";
		}
		
		let payload = pbPacket.getPayload();

		let pbPayload = proto.CloudSyncMessages.DeviceStatus.deserializeBinary(payload);


		return new DeviceStatus(header.getSessionid(),
								header.getSenderid(),
								pbPayload.getDevice(),
								pbPayload.getStatus()
								);
    }
}

// -----------------------------------------------------------------------------

/**
 * Response message for a device registration. Contains WallClock service URL.
 */
class UnexpectedDeviceExit extends Message
{
	constructor(sessionId, senderId)
	{
		super(proto.CloudSyncMessages.MessageType.UNEXPECTED_DEVICE_EXIT, sessionId, "0.2.0", senderId);
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		var msghdr = new proto.CloudSyncMessages.Header();

		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.UNEXPECTED_DEVICE_EXIT);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		msghdr.setSenderid(this.senderId);

		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a TimelineUpdateResp
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.UNEXPECTED_DEVICE_EXIT)
		{
			throw "Not a UNEXPECTED_DEVICE_EXIT message";
		}
		
		return new UnexpectedDeviceExit( header.getSessionid(), header.getSenderid());
    }
}

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

class SyncTimelinesAvailable extends Message
{

	constructor(sessionId, timelineInfoArray, msgId)
	{
		super(proto.CloudSyncMessages.MessageType.SYNC_TIMELINES_AVAIL, sessionId, "0.2.0", "cloud-sync");
		
		if (!(Array.isArray(timelineInfoArray)))
			throw "timelineInfoArray is not an array.";
		else
		{
			if (timelineInfoArray.length > 0)
			{
				if (!timelineInfoArray[0].hasOwnProperty("timelineId"))
				{
					throw "timelineInfoArray does not contain TimelineInfo objects.";
				}
			}
			
			this.timelineInfoArray =  timelineInfoArray;
			if ((typeof msgId !== "undefined") && (msgId !== null))
			{
				this.id = msgId;
			}
		}			
	}

	/**
	 * Serialise to binary array (Uint8Array) using Protocol Buffers.
	 */
	serialise()
	{
		// packet header
		var msghdr = new proto.CloudSyncMessages.Header();
		msghdr.setMsgtype(proto.CloudSyncMessages.MessageType.SYNC_TIMELINES_AVAIL);
		msghdr.setSessionid(this.sessionId);
		msghdr.setMessageid(this.id);
		msghdr.setVersion(this.version);
		
		if ((typeof this.senderId !=="undefined") && (this.senderId !== null))
		{
			msghdr.setSenderid(this.senderId);
		}

		msghdr.setResponsecode(this.responseCode);

		// packet payload
		var  payload = new proto.CloudSyncMessages.SyncTimelinesAvailable();
		
		this.timelineInfoArray.forEach(obj => {

			let pbTlInfo = new proto.CloudSyncMessages.TimelineInfo();

			var timelineId = (typeof obj.timelineId !== "undefined") ? obj.timelineId : obj.id;

			pbTlInfo.setTimelineid(timelineId);
			pbTlInfo.setTimelinetype(obj.timelineType);
			if (typeof obj.contentId !== "undefined") pbTlInfo.setContentid(obj.contentId);
			if (typeof obj.frequency !== "undefined") pbTlInfo.setFrequency(obj.frequency);
			if (typeof obj.channel !== "undefined") pbTlInfo.setChannel(obj.channel);
			if (typeof obj.providerId !== "undefined") pbTlInfo.setProviderid(obj.providerId);
			if (typeof obj.providerType !== "undefined") pbTlInfo.setProvidertype(obj.providerType);
			if ((typeof obj.parentTL !== "undefined") && (obj.parentTL !== null)) pbTlInfo.setParenttimelineid(obj.parentTL);

			if ((typeof obj.parentTLCorr !== "undefined") && (obj.parentTLCorr !== null))
			{	
				var corr = new proto.CloudSyncMessages.Correlation();
				corr.setParenttime(obj.parentTLCorr.parentTime);
				corr.setChildtime(obj.parentTLCorr.childTime);
				if (typeof obj.parentTLCorr.initialError !== "undefined")
				{
					corr.setInitialerror(obj.parentTLCorr.initialError);
				}
				if (typeof obj.parentTLCorr.errorGrowthRate !== "undefined")
				{
					corr.setErrorgrowthrate(obj.parentTLCorr.errorGrowthRate);
				}
				
				pbTlInfo.setParentcorrelation(corr);
			} 
			
			if ((typeof obj.lastTimestamp !== "undefined") && (obj.lastTimestamp !== null))
			{
				pbTlInfo.setLasttimestamp(TimelineSubscriptionRESP.protoTimestampFromTimestamp(obj.lastTimestamp));
			}

			payload.addTimelineinfo(pbTlInfo);
		});
		var payloadAsBytes = payload.serializeBinary();

		// create packet
		var packet = new proto.CloudSyncMessages.Packet();
		packet.setHeader(msghdr);
		packet.setPayload(payloadAsBytes);

		var bytes = Buffer.from(packet.serializeBinary());
		return bytes;

	}

	/**
	 * 
	 * @param {Uint8Array} binaryMsg 
	 */
	static deserialise(binaryMsg)
	{
		
		let pbPacket = proto.CloudSyncMessages.Packet.deserializeBinary(binaryMsg);
		let header = pbPacket.getHeader();

		if ((typeof header === "undefined") || (header === null))
			return null;
		
		// check if message is a SYNC_TIMELINES_AVAIL
		if (header.getMsgtype() !== proto.CloudSyncMessages.MessageType.SYNC_TIMELINES_AVAIL)
		{
			throw "Not a SYNC_TIMELINES_AVAIL message";
		}

		let payload = pbPacket.getPayload();
		let pbRESP = proto.CloudSyncMessages.SyncTimelinesAvailable.deserializeBinary(payload);

		let listOfTimelines = [];
		let timelineInfoList = pbRESP.getTimelineinfoList();

		if ((Array.isArray(timelineInfoList)) && (timelineInfoList.length > 0) )
		{
			timelineInfoList.forEach(tl => {

				let pbCorr = tl.getParentcorrelation();
				let corr = null;

				if ((pbCorr !== null) && (typeof pbCorr !== "undefined"))
				{
					corr = new Correlation(pbCorr.getParenttime(), pbCorr.getChildtime(), pbCorr.getInitialerror(), pbCorr.getErrorgrowthrate());
				}

				// let protoTs = tl.getLasttimestamp();
				listOfTimelines.push(new TimelineInfo(tl.getTimelineid(),
					tl.getTimelinetype(),
					tl.getContentid(),
					tl.getFrequency(),
					tl.getChannel(),
					tl.getProviderid(),
					tl.getProvidertype(),
					tl.getParenttimelineid(),
					corr,
					TimelineSubscriptionRESP.timestampFromProtoTimestamp(tl.getLasttimestamp()))
				);
			});	
		}

		return new SyncTimelinesAvailable(header.getSessionid(), 
							listOfTimelines,
							header.getMessageid()
							);
	}

}


// -----------------------------------------------------------------------------

module.exports = {
	MessageType,
	Message,
	JoinREQ,
	JoinRESP,
	DeviceREQ,
	DeviceRESP,
	LeaveREQ,
	LeaveRESP,
	StopTimelineUpdateREQ,
	ContentIdChange,
	TimelineDeregistrationREQ,
	TimelineDeregistrationRESP,
	TimelineRegistrationREQ,
	TimelineRegistrationRESP,
	TimelineREQ,
	TimelineRESP,
	TimelineQuery,
	TimelineSubscriptionREQ,
	TimelineSubscriptionRESP,
	TimelineUpdateREQ,
	TimelineUpdateRESP,
	TimelineUpdate,
	DeviceStatus,
	UnexpectedDeviceExit,
	SyncTimelinesAvailable
};
