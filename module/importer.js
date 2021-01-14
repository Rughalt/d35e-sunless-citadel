Hooks.on("init", () => {
    game.settings.register("d35e-sunless-citadel", "imported", {
            scope: "world",
            config: false,
            type: Boolean,
            default: false
    });
})

Hooks.on("renderCompendium", (app, html, data) => {
    if ( data.collection.startsWith("d35e-sunless-citadel.") && !game.settings.get("d35e-sunless-citadel", "imported") ) {
            Dialog.confirm({
                    title: "3.5e Adventure Companion - Sunless Citadel Importer",
                    content: "<p>Welcome to the <strong>Sunless Citadel</strong> adventure companion module for 3.5E SRD. Would you like to import all adventure content to your World?",
                    yes: () => importLabors()
            });
    }
});

/**
* Import content for all the labors
*/
async function importLabors() {
    const module = game.modules.get("d35e-sunless-citadel");
    let scenes = null;
    let actors = [];

    for ( let p of module.packs ) {
            const pack = game.packs.get("d35e-sunless-citadel."+p.name);
            if ( p.entity !== "Playlist" ) await pack.importAll();
            else {
                    const music = await pack.getContent();
                    Playlist.create(music.map(p => p.data));
            }
            if ( p.entity === "Scene" ) scenes = game.folders.getName(p.label);
            if ( p.entity === "Actor" ) actors.push(game.folders.getName(p.label));
    }

    // Re-associate Tokens for all scenes
    const sceneUpdates = [];
    for ( let s of scenes.entities ) {
            const tokens = s.data.tokens.map(t => {
                    for (let actorsDirectory of actors) {
                        const a = actorsDirectory.entities.find(a => a.name === t.name);
                        if (a) {
                                t.actorId = a ? a.id : null;
                                t.actorLink = a ? a.data?.token?.actorLink || false : false;
                        }
                    }
                    return t;
            });
            sceneUpdates.push({_id: s.id, tokens});
    }
    await Scene.update(sceneUpdates);

    // Activate the splash page
    const s0 = game.scenes.getName("Sunless Citadel");
    s0.activate();

    // Display the introduction
    const j1 = game.journal.getName("About Adventure Companion");
    if ( j1 ) j1.sheet.render(true, {sheetMode: "text"});
    return game.settings.set("d35e-sunless-citadel", "imported", true);
}