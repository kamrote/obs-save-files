# Auto move files on replay buffer
 
- Uses OBS Advanced scene switcher (https://obsproject.com/forum/resources/advanced-scene-switcher.395/) to move your clips into a folder with the same name as the game your playing (or "desktop" if none are found)
- Currently supports 1774 games as of 3/26/2023 (any game released after this point will most likely have to be manually added)

## How to use
- Download advanced scene switcher from the link above and install it
- Copy this repo and install the required packages (npm i)
- change your base_path in processes.json (ex: D:/videos/obs/replays) (dont put a / at the end either) this will be where it creates the folder for the game and places the recording
- in advanced scene switcher open it up, make a new macro. add a conditon called "(if) (replay buffer) (saved)" than add a action called "run", put the run file to the save_files.bat file in the repo
![Example](https://i.imgur.com/GsuIsrE.png "Example")
- it should move the file whenever you save a replay buffer
- (!IMPORTANT) make sure that the place your saving your recordings to in obs is the same place as base_path in processes.json

## How to add a game
- open processes.json, and add a new entrie in "processes" (like the others) with the processes name (cap sensetive) and whatever the name for the game is