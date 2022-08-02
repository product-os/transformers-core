const fs = require('fs')

console.log('Starting test transformer')

console.log('Reading input manifest')
const inputManifest = JSON.parse(fs.readFileSync('/input/manifest.json').toString())

console.log('Reading input artifact path')
const artifact = fs.readFileSync('/input/artifact').toString()

console.log('Writing output artifact')
const outputArtifactPath = '/output/response.txt'
if (artifact === 'Hello world!') {
	fs.writeFileSync(outputArtifactPath, 'Nice to meet you!')
} else {
	fs.writeFileSync(outputArtifactPath, 'Sorry, I dont understand!')
}

const outputContract = inputManifest.contract.data.fragment

const result = {
	results: [
		{
			contract: outputContract,
			artifactPath: outputArtifactPath,
		},
	],
}

console.log('Test transformer results', result)
fs.writeFileSync('/output/manifest.json', JSON.stringify(result))
