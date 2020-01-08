
class TimelineInfo
{
	constructor(timelineId, timelineType, contentId, frequency, channel, providerId, providerType)
	{
		this.timelineId = timelineId;
		this.timelineType = timelineType;
		if ((typeof contentId !== "undefined") || (contentId !== null))
		{
			this.contentId = contentId;
		}
		this.frequency =  frequency;
		this.channel = channel;

		if ((typeof providerId !== "undefined") || (providerId !== null))
		{
			this.providerId = providerId;
		}

		if ((typeof providerType !== "undefined") || (providerType !== null))
		{
			this.providerType = providerType;
		}
	}
}

module.exports = TimelineInfo;