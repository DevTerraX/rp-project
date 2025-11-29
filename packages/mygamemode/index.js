mp.gui.chat.colors = true;

mp.events.addCommand('hp', (player) => {
    player.health = 100;
    player.outputChatBox('!{00ff00}HP = 100');
});

mp.events.addCommand('veh', (player, model = "adder") => {
    const pos = player.position;
    mp.vehicles.new(mp.joaat(model), pos, {
        dimension: player.dimension
    });
    player.outputChatBox(`!{00aaff}Спавню машину: ${model}`);
});
