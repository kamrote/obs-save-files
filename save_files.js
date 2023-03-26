const fs = require('fs')
const path = require('path')
const _ = require('underscore');
let process_list = require('./processes.json');process_list.base_path = process_list.base_path.replaceAll('\\', '/')
const notifier = require('node-notifier');
const exec = require('child_process').exec

const getMostRecentFile = (dir) => {
    const files = fs.readdirSync(dir)
      .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
      .map((file) => ({ name: file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  
    const mostRecentFile = files.length ? files[0].name : undefined;
    const isOld = files.length && (Date.now() - files[0].mtime.getTime()) > 20000;
  
    return {
        file: mostRecentFile,
        old: isOld,
    };
};
function isRunning(win, mac, linux){
    return new Promise(function(resolve, reject){
        const plat = process.platform
        const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
        const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
        if(cmd === '' || proc === ''){
            resolve(false)
        }
        exec(cmd, function(err, stdout, stderr) {
            resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
        })
    })
}
const ensureFolderExists = async (folderPath) => {
    await exec(`mkdir ${path.join(...folderPath.split('/'))}`)
};
async function do_notification(dir_path, game) {
    notifier.notify({
        title: 'OBS Replay',
        message: 'Replay buffer saved to ' + game,
        sound: true,
        wait: false,
    });
    notifier.on('click', function (notifierObject, options, event) {
        console.log(dir_path.split('/')[dir_path.split('/').length - 1])
        exec('start "" "' + dir_path.split(dir_path.split('/')[dir_path.split('/').length - 1])[0] + '"')
    });
}
async function check_process(process_name, int) {
    isRunning(process_name, process_name.split('.exe')[0], process_name.split('.exe')[0]).then(async (v) => {
        console.log('checking ' + process_name + ' - ' + v) 
        if (v === true) {
            let most_recent = getMostRecentFile(process_list.base_path)
            if (most_recent.old === false) {
                await ensureFolderExists(process_list.base_path + '/' + process_list.processes[int].game);
                setTimeout(async () => {
                    fs.rename(process_list.base_path + '/' + most_recent.file, process_list.base_path + '/' + process_list.processes[int].game + '/' + process_list.processes[int].game + ' ' + most_recent.file, function (err) {
                        if (err) throw err
                    })
                    console.log('found - ' + process_list.processes[int].game)
                    do_notification(process_list.base_path + '/' + process_list.processes[int].game + '/' + process_list.processes[int].game + ' ' + most_recent.file, process_list.processes[int].game)
                }, 1500)
            } else {
                console.log('too old')
            }
        } else {
            if (process_list.processes[int + 1] !== undefined && process_list.processes[int + 1] !== null) {
                check_process(process_list.processes[int + 1].process, (int + 1)) //terrible way to do this
            } else {
                let most_recent = getMostRecentFile(process_list.base_path)
                if (most_recent.old === false) {
                    await ensureFolderExists(process_list.base_path + '/DESKTOP');
                    setTimeout(async () => {
                        fs.rename(process_list.base_path + '/' + most_recent.file, process_list.base_path + '/DESKTOP/DESKTOP ' + most_recent.file, function (err) {
                            if (err) throw err
                        })
                        do_notification(process_list.base_path + '/DESKTOP/DESKTOP ' + most_recent.file, 'DESKTOP')
                    }, 1500);
                } else {
                    console.log('too old')
                }
                console.log('didnt find')
            }
        }
    })
}
check_process(process_list.processes[0].process, 0)
