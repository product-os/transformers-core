const fs = require('fs')
const {randomUUID} = require("crypto");

console.log('Starting test transformer')

console.log('Reading input artifact path')
const artifact = fs.readFileSync('/input/artifact').toString()

console.log('Writing output artifact')
const outputArtifactPath = '/output/response.txt'
if (artifact === 'Hello world!') {
	fs.writeFileSync(outputArtifactPath, 'Nice to meet you!')
} else {
	fs.writeFileSync(outputArtifactPath, 'Sorry, I dont understand!')
}

const result = {
	results: [
		{
			contract: {
				name: 'greeting',
				type: 'text-file',
				version: randomUUID(),
				typeVersion: '1.0.0'
			},
			artifactPath: outputArtifactPath,
		},
	],
}

console.log('Test transformer results', result)
fs.writeFileSync('/output/manifest.json', JSON.stringify(result))
