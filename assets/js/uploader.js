(function ($) {
	'use strict';

	var Uploader = function (element, options) {
		var Progress              = function (element, options) {
			this.text = $('<span/>');

			this.bar = $('<div/>')
				.addClass('progress-bar')
				.attr('role', 'progressbar')
				.attr('aria-valuemin', '0')
				.attr('aria-valuemax', '100')
				.append(this.text);

			this.set(0);

			element.append($('<div/>').addClass('progress').append(this.bar));

			return this;
		};
		Progress.prototype.set    = function (value) {
			if (value < 0)
				value = 0;
			if (value > 100)
				value = 100;
			this.bar
				.attr('aria-valuenow', value)
				.css('width', value + '%');
			this.text.html(value + '%')
		};
		Progress.prototype.remove = function () {
			this.bar.remove();
			this.text.remove();
		};

		var File                = function (element, options) {
			element.attr('id', 'vu-' + options.id);

			this.id     = options.id;
			this.guid   = null;
			this.errors = [];

			this.name = $('<span/>')
				.addClass('vu-file-name')
				.html(options.name);

			this.size = $('<span/>')
				.addClass('vu-file-size')
				.html(humanSize(options.size));

			this.btnRemove = $('<span/>')
				.addClass('vu-file-remove')
				.click(function () {
					removeFile(options.id);
				})
				.html('&times;');

			this.info = $('<div/>')
				.addClass('vu-file-info')
				.append(this.btnRemove)
				.append(this.name)
				.append(this.size);

			var prEl = $('<div/>')
				.addClass('vu-file-progress');

			this._progress = new Progress(prEl);

			this.element = element
				.append(this.info)
				.append(prEl);

			return this;
		};
		File.prototype.addError = function (text) {
			if (this.errors.length == 0) {
				this.element.prepend($('<div/>').addClass('vu-file-errors').append($('<ul/>')));
			}
			this.errors.push(text);
			this.element.find('.vu-file-errors ul').append($('<li/>').html(text));
		};
		File.prototype.progress = function (value) {
			this._progress.set(value);
		};
		File.prototype.remove   = function () {
			this.info.remove();
			this._progress.remove();
			this.element.remove();
		};
		File.prototype.status   = function (name) {
			this.element.removeClass(function (index, css) {
				var m = css.match(/(^|\s)vu-file-status-\S+/g);
				if (m == null)
					return null;
				else
					return m.join(' ');
			});
			this.element.addClass('vu-file-status-' + name);
		};

		var humanSize = function (bytes, decimals) {
			if (bytes == 0) return '0 Byte';
			var k     = 1024;
			var dm    = decimals + 1 || 3;
			var sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
			var i     = Math.floor(Math.log(bytes) / Math.log(k));
			return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[ i ];
		};

		// Working wth files.
		var clearFileList = function () {
			for (var i = 0; i < flow.files.length; i++) {
				flow.removeFile(flow.files[ i ]);
			}
			for (var i = 0; i < fileList.length; i++) {
				fileList[ i ].remove();
			}
			fileList = [];
			btnClear.attr('disabled', 'disabled');
			btnUpload.attr('disabled', 'disabled');
			btnSelect.children('span').html(options.messages.select);
		};

		var findFile = function (id) {
			for (var i = 0; i < fileList.length; i++) {
				if (fileList[ i ].id == id)
					return fileList[ i ];
			}
			return null;
		};

		var progressFile = function (id, value) {
			var f = findFile(id);
			if (f != null)
				f.progress(value);
		};

		var removeFile = function (id) {
			for (var i = 0; i < flow.files.length; i++) {
				if (flow.files[ i ].uniqueIdentifier == id) {
					flow.removeFile(flow.files[ i ]);
					break;
				}
			}

			for (var i = 0; i < fileList.length; i++) {
				if (fileList[ i ].id == id) {
					fileList[ i ].remove();
					fileList.splice(i, 1);
				}
			}
		};

		var upload = function () {
			btnSelect.attr('disabled', 'disabled');
			btnClear.attr('disabled', 'disabled');
			btnUpload.attr('disabled', 'disabled');
			for (var i = 0; i < fileList.length; i++)
				fileList[ i ].btnRemove.remove();
			flow.upload();
		};

		this.options = $.extend(true, {}, Uploader.defaults, options);

		var fileList = [];

		var fileInput = $('<input/>')
			.attr('type', 'file');

		var btnSelect = $('<div/>')
			.addClass('btn btn-default vu-file-select')
			.html($('<span/>').html(options.messages.select))
			.append(fileInput);

		var btnUpload = $('<div/>')
			.addClass('btn btn-success')
			.html(options.messages.upload)
			.attr('disabled', 'disabled')
			.click(function () {
				upload();
			});

		var btnClear = $('<div/>')
			.addClass('btn btn-warning')
			.html(options.messages.clear)
			.click(function () {
				clearFileList();
			})
			.attr('disabled', 'disabled');

		element.append($('<div/>')
			.addClass('vu-controls')
			.append(btnSelect)
			.append(btnUpload)
			.append(btnClear)
		);

		Flow.prototype.hasErrors = function () {
			for (var i = 0; i < this.files.length; i++) {
				if (this.files[ i ].error == true)
					return true;
			}
			return false;
		};

		var flow = new Flow({
			target                   : options.target,
			uploadMethod             : 'POST',
			chunkSize                : options.chunksize,
			simultaneousUploads      : 20,
			query                    : options.query,
			generateUniqueIdentifier : function () {
				return $.ajax({
					type  : 'GET',
					url   : '/uploader/file/guid',
					async : false
				}).responseText;
			}
		});

		flow.on('filesAdded', function (files, e) {
			btnUpload.attr('disabled', 'disabled');
			for (var i = 0; i < files.length; i++) {
				var c = $('<div/>').addClass('vu-file-item');
				fileList.push(new File(c, {
					id   : files[ i ].uniqueIdentifier,
					name : files[ i ].name,
					size : files[ i ].size
				}));
				element.append(c);
			}
			if (fileList.length == 0) {
				btnClear.attr('disabled', 'disabled');
				btnUpload.attr('disabled', 'disabled');
				btnSelect.children('span').html(options.messages.select);
			} else {
				btnClear.removeAttr('disabled');
				btnUpload.removeAttr('disabled');
				btnSelect.children('span').html(options.messages.add);
			}
		});

		flow.on('fileError', function (f, message, chunk) {
			var file = findFile(f.uniqueIdentifier);
			if (file != null) {
				file.status('error');
				file.addError(message);
			}
		});

		flow.on('fileProgress', function (f) {
			progressFile(f.uniqueIdentifier, parseInt(f.progress() * 100));
		});

		flow.on('fileSuccess', function (f, message, chunk) {
			var file = findFile(f.uniqueIdentifier);
			if (file != null) {
				file.status('ok');
				file.guid = f.uniqueIdentifier;
			}
		});

		flow.on('complete', function () {
			if (!this.hasErrors()) {
				var guids       = fileList.map(function (item) {
					return item.guid;
				});
				window.location = '/uploader/file?last=' + guids.join(',');
			}
		});

		flow.assignBrowse(fileInput);

		return this;
	};

	Uploader.prototype.defaults = {
		extensions : null,
		messages   : {
			add    : 'Add files',
			clear  : 'Clear list',
			remove : 'Remove file',
			select : 'Select files',
			upload : 'Upload'
		}
	};

	$.fn.uploader = function (options) {
		return this.each(function () {
			new Uploader($(this), options);
		});
	};
}(jQuery));