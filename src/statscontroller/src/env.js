
/** InfluxDB v2 URL */
const url = process.env['INFLUX_URL'] || 'http://35.179.17.39:9999'
/** InfluxDB authorization token */
const token = process.env['INFLUX_TOKEN'] || '386kJJ-6RiCpFs9oTKqZXFH_7GmsE7Nq-vVAgtMEFW2q2GcygByARsgvyMrrD6rwGdJJEIux1gC4C4FcZmvcoA=='
/** Organization within InfluxDB URL  */
const org = process.env['INFLUXDB_ORG'] || 'BBC'
/**InfluxDB bucket used in examples  */
const bucket = 'CloudSync'
// ONLY onboarding example
/**InfluxDB user  */
const username = 'bbctogether'
/**InfluxDB password  */
const password = 'w4tchp4rty'

module.exports = {
	url,
	token,
	org,
	bucket,
	username,
	password,
}
