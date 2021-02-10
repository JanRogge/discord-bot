const { Settings } = require('../dbObjects');

module.exports = async (client, oldState, newState) => {
	if(newState.guild) {
		const settings = await Settings.findOne({
			where: { guild_id: newState.guild.id },
		});

		const addedRoles = newState.roles.cache.filter(role => !oldState.roles.cache.has(role.id));

		if (addedRoles.size === 0) return;

		// Send Message if Live Role was added
		if (addedRoles.some(role => role.id === settings.live_role_id)) {
			const codeChannel = newState.guild.channels.resolve(settings.code_channel_id);
			const messages = await codeChannel.messages.fetch({ limit: 1 });

			let messageContent = messages.first().content;
			if (messages.first().activity) {
				messageContent = messages.first().activity.partyID;
			}

			// Dont send author his message via DM
			if (newState.id === messages.first().author.id) return;

			// Done send blacklisted roles the message via DM
			const blacklistedIds = settings.code_blacklist_roles_id.split(',');
			let blacklisted = false;
			blacklistedIds.forEach(blacklistedId => {
				blacklisted = newState.roles.cache.some(role => role.id === blacklistedId);
			});
			if (blacklisted) return;

			const dmChannel = await newState.user.createDM();

			const dmMessages = dmChannel.messages;

			const message = await dmMessages.fetch(dmMessages.channel.lastMessageID);

			const lastMessageContent = message.content;
			const newMessageContent = `Der letzte Gamecode/Invitelink vom ${messages.first().createdAt.toLocaleString('de-DE')} ist: ${messageContent}`;

			if (lastMessageContent === newMessageContent) return;

			dmChannel.send(newMessageContent);

		}
	}
};