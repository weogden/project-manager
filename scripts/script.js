/*
script.js
Willaim Ogden
January 2013
Purpose: Creates the models, views and collections for the Project manager. 
	Specifically each project is a model.
	The project manager contains a collection of model views.
	Each goal is a model.
	Each project view contains a collection of goal views
*/

//Project Goal -> goal: <string>, startDate: <string>,  status: <boolean>
// note: rest of this models collections/viws are imbedded in the Project view
var Goal = Backbone.Model.extend({});


//Project model -> name: <string>, description: <string>, date: <string>, status: <boolean>
var Project = Backbone.Model.extend({});

//Project model collection
//Uses Backbone.Localstorage plugin instead of a REST API
// Backbone.Localstorage plugin:https://github.com/jeromegn/Backbone.localStorage
var ProjectList = Backbone.Collection.extend({
	localStorage: new Backbone.LocalStorage("ProjectStorage"),
	model: Project
});

//project model View
//should contain: functionality to remove projects, toggle on/off completion and the embedded goal views/collection
var ProjectView = Backbone.View.extend({
	tagName: 'li',
	initialize: function(){
		this.listenTo(this.model, 'change', this.render);
		if (this.model.get('status')) {
			this.$el.toggleClass('grey');
		} 
	},
	events:{
		'click .remove': 'remProject',
		'click .toggle': 'toggleProject'
	},
	remProject: function(){
		this.model.destroy();
		this.remove();
		//bug: ony removes base collection storage.. need to iterate through and destroy each goal model afterwards.. mem leak
		localStorage.removeItem('Goal' + this.model.get('id') + 'Storage');
	},
	toggleProject: function(){
		this.model.save({status: !this.model.get('status')});
		this.$el.toggleClass('grey');
		//allows toolTips to work on toggled content without a full refresh, check help.js
		$(document).trigger('domChange');
		
	},
	render: function() {
		function niceDate(d) {
			var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			return (month[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear());
		}
		if (this.model.get('status')) {
			var checked = "<span class='small'>complete</span><input type='checkbox' class='toggle' checked>";
		} else {
			var checked = "<span class='small'>complete</span><input type='checkbox' class='toggle' >";
		}
		//note: learn about templates
		var html = "<h3>" + this.model.get('name') + "</h3><span class='right'>" + niceDate(new Date(this.model.get('date'))) + "</span>" +
			"<br><p><h4>Description: </h4>" + this.model.get('description') + 
			"</p></h3><span class='right'><button class='remove'>Remove Project</button></span><br>" + checked +
			"<ul id='" + this.model.get('id') + "Goal'></ul>";
		this.$el.html(html);
		
		//goal model/views====================================================================================
		var Name = this.model.get('id');
		var save = 'Goal' + Name + 'Storage';
		$( document ).ready(function(){
						
			//Goal collection
			var GoalList = Backbone.Collection.extend({
				localStorage: new Backbone.LocalStorage(save),
				model: Goal
			});
			
			//Goal model view
			//Should contain: remove and toggle
			var GoalView = Backbone.View.extend({
				tagName: 'li',
				className: 'goals',
				initialize: function() {
					this.listenTo(this.model, 'change', this.render);
					if (this.model.get('status')) {
						this.$el.toggleClass('grey');
					} 
				},
				events: {
					'click .remove': 'remGoal',
					'click .toggle': 'toggleGoal'
				},
				remGoal: function(){
					this.model.destroy()
					this.remove()
				},
				toggleGoal: function() {
					this.model.save({status: !this.model.get('status')});
					this.$el.toggleClass('grey');
					//allows toolTips to work on toggled content without a full refresh, check help.js
					$(document).trigger('domChange');
				},
				render: function(){
					if (this.model.get('status')) {
						var checked = "<span class='small'>complete</span><input type='checkbox' class='toggle' checked>";
					} else {
						var checked = "<span class='small'>complete</span><input type='checkbox' class='toggle' >";
					}
					var html = this.model.get('goal') + "<span class='right'>" + niceDate(new Date(this.model.get('date'))) + "</span><br>" +
						 checked  + "<button class='remove right'>Remove</button>";
					this.$el.html(html);
					return this;
				}
			});
			
			//Goal collection view
			var GoalListView = Backbone.View.extend({
				el:$(('#' + Name + 'Goal')),
				initialize: function() {
					this.collection = new GoalList();
					this.collection.fetch();
					this.render();
					this.$('#hide').hide();
					this.$('li').hide();
					
					this.collection.on('add', this.renderGoal, this);
				},
				events:{
					'click .show': 'showGoals',
					'click .addGoal': 'addGoals'
				},
				showGoals: function(e) {
					e.preventDefault();
					this.$('.show').toggle();
					this.$('li').toggle();
				},
				addGoals: function(e) {
					e.preventDefault();
					var milestone = this.$('.writtenGoal').val();
					this.$('.writtenGoal').val('');
					var newGoal = {goal:milestone, date:(new Date()), status:false}
					this.collection.create(newGoal);
					//allows toolTips to work on newly create content without a full refresh
					$(document).trigger('domChange');
				},
				renderGoal: function(item) {
					var goalView = new GoalView({
						model: item
					});
					this.$el.append(goalView.render().el);
				},
				render: function() {
					var html = "<button class='show'>Show Goals & Milestones</button>" +
						"<button id='hide' class='show'>Hide Goals & Milestones</button>" +
						"<li class='goals'> <input type='text' class='writtenGoal' size='70'>" +
						"<button class='addGoal'>Add Goal</button>" +
						"</li>";
					this.$el.html(html);
					var that = this;
					_.each(this.collection.models, function(item) {
						that.renderGoal(item);
					}, this);
				}
			});
			
			var goalListView = new GoalListView();
		});
		//=========================================================================================================
		return this;
	},
});

//Project Collection view
var ProjectListView = Backbone.View.extend({
	el:$("div"),
	initialize: function() {
		this.collection = new ProjectList();
		this.collection.fetch();
		this.render();
		
		this.collection.on('add', this.renderProject, this);
	},
	events:{
		'click #add': 'addProject'
	},
	addProject: function(e) {
		e.preventDefault();
		var nam = $('#name').val();
		$('#name').val('')
		var descript = $('#description').val();
		$('#description').val('')
		var newProject = {name:nam, description:descript, date:(new Date()), status:false}
		this.collection.create(newProject);
		//allows toolTips in help.js to work on newly create content without a full refresh, check help.js
		$(document).trigger('domChange');
	},
	renderProject: function(item) {
		var projectView = new ProjectView({
			model: item
		});
		this.$el.append(projectView.render().el);
	},
	render: function() {
		this.$el.html("Project Name: <input id='name' type='text'/><br>" +
			"Project Description:<br><textarea id='description' rows='4' cols='50'></textarea><br><button id='add'>Add Project</button></li>");
		var that = this;
		_.each(this.collection.models, function(item) {
			that.renderProject(item);
		}, this);
	}
});


//initialize the app
var projectListView = new ProjectListView();
