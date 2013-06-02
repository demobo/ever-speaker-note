var Evernote = require('evernote').Evernote;
var noteStore;

exports.retrieveNote = function(response, authToken, title) {
	console.log('5 - ' + title);
	fs = require('fs');
	crypto = require('crypto');
	
	if (authToken == "your developer token") {
		console.log("Please fill in your developer token");
		console.log("To get a developer token, visit https://sandbox.evernote.com/api/DeveloperToken.action");
		process.exit(1);
	}

	var client = new Evernote.Client({
		token : authToken,
		sandbox : true
	});

	var userStore = client.getUserStore();

	userStore.checkVersion("Evernote EDAMTest (Node.js)", Evernote.EDAM_VERSION_MAJOR, Evernote.EDAM_VERSION_MINOR, function(versionOk) {
		console.log("Is my Evernote API version up to date? " + versionOk);
		console.log();
		if (!versionOk) {
			process.exit(1);
		}
	});

	// // List all of the notebooks in the user's account
	// var notebooks = noteStore.listNotebooks(function(notebooks) {
		// console.log(notebooks);
// 
		// console.log("Found " + notebooks.length + " notebooks:");
		// for (var i in notebooks) {
			// console.log("  * " + notebooks[i].name);
		// }
	// }); 

	//retrive note
	FindNote(authToken, title, function(note){
		console.log('41 - ' + note.title);
		response.send(note.content);
	});
}

function FindNote(authToken, title, callback) {
	
	var client = new Evernote.Client({
		token : authToken,
		sandbox : true
	});
	
	var noteStore = client.getNoteStore();
	
	var filter = new Evernote.NoteFilter();
	filter.notebookGuid = 'ea4bc666-8c92-43ff-8c25-18aabe5834b4';
	
	var spec = new Evernote.NotesMetadataResultSpec();
	console.log('59 - ' + spec);
	spec.includeTitle=true;
	
	noteStore.findNotesMetadata(authToken, filter, 0, 10, spec, function(noteList){
		var notes = noteList.notes;
		for (i in notes)
		{
			console.log('62 - ' + notes[i].title);
			if (notes[i].title == title) {
				console.log('69 - ' + notes[i]);
				noteStore.getNote(authToken, notes[i].guid, true, false, false, false, function(note){
					callback(note);
				});
			}
		}
	});
}


