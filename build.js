var Builder = require('electron-builder');
var cla = require('command-line-args');
const defs = [
    { name: 'ia32', type: Boolean, defaultValue: false },
    { name: 'x64', type: Boolean, defaultValue: false }
];
const opts = cla(defs);

const config = {
    appId: 'org.octodumb.osumixer',
    buildDependenciesFromSource: true,
    win: {
        target: 'nsis',
        icon: 'assets/osu-mixer-logo.ico',
    }
};

(async function() {
    if(opts.x64) {
        console.log("Building x64")
        var x64 = await Builder.build({
            config: Object.assign(config, {
                artifactName: "osu! mixer Setup ${version} win-x64.${ext}"
            }),
            x64: true
        });
        console.log("Finished building x64", x64);
    }

    if(opts.ia32) {
        console.log("Building ia32");
        var ia32 = await Builder.build({
            config: Object.assign(config, {
                artifactName: "osu! mixer Setup ${version} win-ia32.${ext}"
            }),
            ia32: true
        });
        console.log("Finished building ia32", ia32);
    }
})();