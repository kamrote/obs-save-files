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
const ensureFolderExists = async (folderPath) => {
    console.log(folderPath)
    await exec(`mkdir "${folderPath.replaceAll('/','\\')}"`);
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
    exec('tasklist', async (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        const lines = stdout.split('\n');
        const processLines = lines.slice(2);
        const processNames = processLines.map((line) => {
            return line.split(/\s+/)[0];
        });
        let found_exec = false;
        for (i = 0; i < processNames.length; i++) {
            let exec_location = process_list.processes.find(p => p.execs.findIndex(e => e.process.toLowerCase() === processNames[i].toLowerCase()) !== -1)?.game;
            if (exec_location) {
                console.log(exec_location + ' is open')
                found_exec = true
                let most_recent = getMostRecentFile(process_list.base_path)
                if (most_recent.old === false) {
                    await ensureFolderExists(process_list.base_path + '/' + exec_location);
                    setTimeout(async () => {
                        fs.rename(process_list.base_path + '/' + most_recent.file, process_list.base_path + '/' + exec_location + '/' + exec_location + ' ' + most_recent.file, function (err) {
                            if (err) throw err
                        })
                        do_notification(process_list.base_path + '/' + exec_location + '/' + exec_location + ' ' + most_recent.file, exec_location)
                    }, 1500)
                } else {
                    console.log('file is too old')
                }
                break
            }
        }
        if (!found_exec) {
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
                console.log('file is too old')
            }
        }
    });
}
check_process()
