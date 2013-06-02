var Evernote = require('evernote').Evernote;
var noteStore;

exports.createnote = function(authToken, pdfObj) {
	fs = require('fs');
	crypto = require('crypto');

	//
	// A simple Evernote API demo script that lists all notebooks in the user's
	// account and creates a simple test note in the default notebook.
	//
	// Before running this sample, you must fill in your Evernote developer token.
	//
	// To run (Unix):
	//   node EDAMTest.js
	//

	// Real applications authenticate with Evernote using OAuth, but for the
	// purpose of exploring the API, you can get a developer token that allows
	// you to access your own Evernote account. To get a developer token, visit
	// https://sandbox.evernote.com/api/DeveloperToken.action
	//var authToken = "S=s1:U=6bd2e:E=14659cc18fd:C=13f021aed00:P=185:A=demobo:V=2:H=0d2a742eeafb6cddd72958d0c59be8b8";
	if (authToken == "your developer token") {
		console.log("Please fill in your developer token");
		console.log("To get a developer token, visit https://sandbox.evernote.com/api/DeveloperToken.action");
		process.exit(1);
	}

	// Initial development is performed on our sandbox server. To use the production
	// service, change sandbox: false and replace your
	// developer token above with a token from
	// https://www.evernote.com/api/DeveloperToken.action
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
// 
// 	
// 
	// // List all of the notebooks in the user's account
	// var notebooks = noteStore.listNotebooks(function(notebooks) {
		// console.log("Found " + notebooks.length + " notebooks:");
		// for (var i in notebooks) {
			// console.log("  * " + notebooks[i].name);
		// }
	// });
	
	CreateNotebook(authToken, "Every Speaker Note", function(notebook){
		console.log('59 - CreateNotebook');
		FindNote(authToken, pdfObj.id, function(note) {
			if (note == null) {
				CreateNote(pdfObj, notebook, function(note){
				});
			} else {
				UpdateNote(authToken, note, pdfObj, function(note){
				});
			}
		})
	});
}

function CreateNotebook(authToken, title, callback) {
	var client = new Evernote.Client({
		token : authToken,
		sandbox : true
	});
	console.log('68');
	noteStore = client.getNoteStore();
	console.log('70');
	var notebook = new Evernote.Notebook();
	notebook.name = title;
	notebook.guid = '7fe481b9-cefc-4b7a-aae7-ff3aa650e232';
	
	console.log('75');

	noteStore.createNotebook(authToken, notebook, function(notebook){
		console.log('80 - notebook.guid' + notebook.guid);
		console.log('81 - notebook' + notebook);
		if (notebook == 'EDAMUserException') {
			noteStore.getNotebook(authToken,'7fe481b9-cefc-4b7a-aae7-ff3aa650e232', function(notebook){
				console.log('84 - get notebook - notebook.guid' + notebook.guid);
				callback(notebook);	
			});
		} else {
			callback(notebook);	
		}
	});
}

function CreateNote(pdf, notebook, callback)
{
	// To create a new note, simply create a new Note object and fill in
	// attributes such as the note's title.
	var note = new Evernote.Note();
	note.title = pdf.id;
	note.notebookGuid = notebook.guid;

	// To include an attachment such as an image in a note, first create a Resource
	// for the attachment. At a minimum, the Resource contains the binary attachment
	// data, an MD5 hash of the binary data, and the attachment MIME type.
	// It can also include attributes such as filename and location.
	var image = fs.readFileSync('enlogo.png');
	var hash = image.toString('base64');

	var data = new Evernote.Data();
	data.size = image.length;
	data.bodyHash = hash;
	data.body = image;

	resource = new Evernote.Resource();
	resource.mime = 'image/png';
	resource.data = data;

	// Now, add the new Resource to the note's list of resources
	note.resources = [resource];

	// To display the Resource as part of the note's content, include an <en-media>
	// tag in the note's ENML content. The en-media tag identifies the corresponding
	// Resource using the MD5 hash.
	var md5 = crypto.createHash('md5');
	md5.update(image);
	hashHex = md5.digest('hex');

	// The content of an Evernote note is represented using Evernote Markup Language
	// (ENML). The full ENML specification can be found in the Evernote API Overview
	// at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
	 note.content = '<?xml version="1.0" encoding="UTF-8"?>';
	 note.content += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
	 note.content += '<en-note>'+ JSON.stringify(pdf) +'<br/>';
	 note.content += '<en-media type="image/png" hash="' + hashHex + '"/>';
	 note.content += '</en-note>';
	
	//note.content = JSON.stringify(pdf);

	// Finally, send the new note to Evernote using the createNote method
	// The new Note object that is returned will contain server-generated
	// attributes such as the new note's unique GUID.
	console.log('148' + note.title);
	
	noteStore.createNote(note, function(note) {
		console.log();
		console.log("Creating a new note in the default notebook");
		console.log();
		console.log("Successfully created a new note with GUID: " + note.guid);
		if(callback) {
			callback(note);
		}
	});
}

function FindNote(authToken, title, callback) {
	
	var client = new Evernote.Client({
		token : authToken,
		sandbox : true
	});
	
	var noteStore = client.getNoteStore();
	
	var filter = new Evernote.NoteFilter();
	filter.notebookGuid = '7fe481b9-cefc-4b7a-aae7-ff3aa650e232';
	
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
				return;
			}
		}
		callback(null);
	});
}

function UpdateNote(authToken, note, pdf, callback) {

	var client = new Evernote.Client({
		token : authToken,
		sandbox : true
	});

	console.log('197');
	noteStore = client.getNoteStore();
	console.log('199');
	
	var md5 = crypto.createHash('md5');
	hashHex = md5.digest('hex');

	// The content of an Evernote note is represented using Evernote Markup Language
	// (ENML). The full ENML specification can be found in the Evernote API Overview
	// at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
	 note.content = '<?xml version="1.0" encoding="UTF-8"?>';
	 note.content += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
	 note.content += '<en-note>'+ JSON.stringify(pdf) +'<br/>';
	 note.content += '<en-media type="image/png" hash="' + hashHex + '"/>';
	 note.content += '</en-note>';

	console.log('209' + note.guid);
	console.log('210' + note.title);
	console.log('211' + note.content);

	noteStore.updateNote(authToken, note, function(note) {
		console.log("214 - updated note + " + note.title);
		if(callback) {
			callback(note);
		}
	});

}
