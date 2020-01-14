
class TimelineInfo
{
	constructor(timelineId, timelineType, contentId, frequency, channel, providerId, providerType, parentTL, parentTLCorr, lastTimestamp)
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

		if ((typeof parentTL !== "undefined") || (parentTL !== null))
		{
			this.parentTL = parentTL;
		}

		if ((typeof parentTLCorr !== "undefined") || (parentTLCorr !== null))
		{
			this.parentTLCorr = parentTLCorr;
		}

		if ((typeof lastTimestamp !== "undefined") || (lastTimestamp !== null))
		{
			this.lastTimestamp = lastTimestamp;
		}
	}
}

module.exports = TimelineInfo;