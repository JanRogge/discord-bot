const { Settings } = require('../dbObjects');

module.exports = async (client, oldState, newState) => {
	if(newState.guild) {
		const settings = await Settings.findOne({
			where: { guild_id: newState.guild.id },
		});

		const addedRoles = newState.roles.cache.filter(role => !oldState.roles.cache.has(role.id));

		// Send Message if Live Role was added
		if (addedRoles.some(role => role.id === settings.live_role_id)) {
			const codeChannel = newState.guild.channels.resolve(settings.code_channel_id);
			const messages = await codeChannel.messages.fetch({ limit: 1 });

			let messageContent = messages.first().content;
			if (messages.first().activity) {
				messageContent = messages.first().activity.partyID;
			}

			if (newState.id === messages.first().author.id) return;

			newState.send(`Der letzte Gamecode/Invitelink ist: ${messageContent}`);

		}
	}
};