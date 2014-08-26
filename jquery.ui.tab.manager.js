;
(function($, window, document, undefined) {

    $.widget('ui.tabs', $.ui.tabs, {
        //Options to be used as defaults
        options: {
            siteBaseUrl: baseUrl,
            tabIdTemplate: '{prefix}-{index}',
            tooltipTemplate: false,
            confirmModal: {
                modalId: '#confirm',
                message: 'Deleting will permanently remove the item. Are you sure?',
                ajaxUrl: '#'
            },
            basicContent: {
                title: false,
                controlName: 'data[NewsFeed][{index}][description]',
                editorConfig: false,
                validation: false,
                placeholder: true
            },
            btnAddTab: {
                title: false,
                class: 'tooltip_fastgive',
            },
            btnRemoveTab: {
                title: false,
                class: 'tooltip_fastgive',
            }
        },
        _tabId: 0,
        _getNextTabId: function() {
            return this._tabId++;
        },
        _validateFields: function(holder) {
            return holder.removeClass('validationEngineContainer').addClass('validationEngineContainer')
                    .validationEngine({
                        ignore: "",
                        promptPosition: "bottomLeft", scroll: true, showOneMessage: false,
                        prettySelect: true,
                        usePrefix: "validate_"
                    }).validationEngine('validate');
        },
        __beforeActivate: function(isOff) {
            isOff = isOff || false;
            var that = this;
            var __validate = function(event, eventData) {
                return !!that._validateFields(eventData.oldPanel);
            };
            isOff ? this.element.off('tabsbeforeactivate') : this.element.on('tabsbeforeactivate', __validate);
        },
        _create: function() {
            this._super();
            if (this.options.basicContent.validation) {
                this.__beforeActivate();
            }
            this.options.tabIdTemplate = this.options.tabIdTemplate.replace(/\{prefix\}/g, this.element.attr('id').slice(0, -1));

            this._trigger('afterCreateTabs', null, {that: this});

            this._tabId = this.length();
            (this._tabId === 0) && this._addATab();
            (this.options.btnAddTab || this.options.btnRemoveTab) && this.addMoreButtonsContainer();
        },
        getTypeEl: function(_type, options) {
            options = options || {};
            options.text = options.text || '';
            options.attr = options.attr || {};
            options.attr.class = options.attr.class || (_type !== 'span' ? 'control-' + _type : '');
            return $(document.createElement(_type)).attr(options.attr).text(options.text);
        },
        addMoreButtonsContainer: function() {
            this.moreButtonsContainer = this.getTypeEl('ul', {
                attr: {
                    class: 'inlinePagination'
                }
            }).insertAfter(this.tablist);
            this.options.btnAddTab && this.addMoreTabButton();
            this.options.btnRemoveTab && this.addRemoveTabButton();
        },
        addMoreTabButton: function() {
            var that = this;
            this.btnAddTab = this.getTypeEl('a', {
                attr: this.options.btnAddTab,
                text: '+'
            }).appendTo(this.moreButtonsContainer)
                    .wrap('<li></li>')
                    .on('click', function() {
                        that._addATab();
                        return false;
                    });

            this.options.btnAddTab.title ? this.btnAddTab.tooltip() : this.btnAddTab.removeAttr('title');

        },
        addRemoveTabButton: function() {
            var that = this;
            this.btnRemoveTab = this.getTypeEl('a', {
                attr: this.options.btnRemoveTab,
                text: '-'
            }).appendTo(this.moreButtonsContainer)
                    .wrap('<li></li>')
                    .on('click', function() {
                        that._removeATab();
                        return false;
                    });

            this.options.btnRemoveTab.title ? this.btnRemoveTab.tooltip() : this.btnRemoveTab.removeAttr('title');
            this.confirmModal = $(this.options.confirmModal.modalId);
        },
        _addATab: function() {
            var that = this;
            var _eventData = {
                index: this.tabs.index(this.active),
                tab: this.active,
                panel: this._getPanelForTab(this.active),
                that: this
            };
            if (this.options.basicContent.validation && !this._validateFields(_eventData.panel)) {
                return false;
            }

            if (this._trigger("beforeAddATab", null, _eventData) === false) {
                return false;
            }

            if (this.options.basicContent.validation) {
                this.__beforeActivate(true);
            }

            var _index = this._getNextTabId();
            var _label = this.length();

            this.add('#' + this.options.tabIdTemplate.replace(/\{index\}/g, _index), (_label + 1), _index);
            var _tab = this.tabs.eq(-1);
            var _panel = this._getPanelForTab(_tab);
            if (_index === 0) {
                this.element.find('.positionRelative').append(_panel);
            }
            var _eventData = {
                index: _index,
                tab: _tab,
                panel: _panel,
                that: this
            };
            //add some basic content
            this.options.basicContent && this._addBasicContent(_eventData);

            this._trigger("loadControls", null, _eventData);
            this._trigger("load", null, _eventData);
            this.select(_label);

            if (this.options.basicContent.validation) {
                this.__beforeActivate();
            }
        },
        _addBasicContent: function(_elData) {
            this.basicContainerRow = this._getControlRow().appendTo(_elData.panel);
            this.getTypeEl('textarea', {
                attr: {
                    class: 'pull-left control-textarea',
                    maxlength: 140,
                    placeHolderText: 'Fill in text {label} here',
                    placeholder: 'Fill in text {label} here'.replace(/\{label\}/g, _elData.tab.text()),
                    cols: 10,
                    rows: 5,
                    wrap: 'break',
                    title: (this.options.basicContent.title || ''),
                    name: this.options.basicContent.controlName.replace(/\{index\}/g, _elData.index)
                },
                text: ''
            }).appendTo(this.basicContainerRow).tooltip(this.options.tooltipTemplate);

            var _textArea = $('textarea', this.basicContainerRow);

            if (this.options.basicContent.validation) {
                _textArea.addClass(this.options.basicContent.validation.class).attr('id', this._getMixedId('txt-', _elData.index));
                this.getTypeEl('span').addClass('pull-left req').appendTo(this.basicContainerRow);
            }

            if (this.options.basicContent.editorConfig && this.options.basicContent.validation) {
                this.basicContainerRow.attr('id', this._getMixedId('validate_txt-', _elData.index));
            }

            if (this.options.basicContent.editorConfig) {
                _textArea.editable(this.options.basicContent.editorConfig);
                $('.froala-element', this.basicContainerRow).on('blur', function() {
                    var _text = _textArea.editable('getText');
                    if (_text && _text[0] == '') {
                        _textArea.editable('setHTML', '', false);
                        _textArea.val('');
                    }
                });
            } else {
                this.addCloseButton(this.basicContainerRow, 'textarea');
            }

        },
        _getMixedId: function(prefix, index) {
            return prefix + this.options.tabIdTemplate.replace(/\{index\}/g, index);
        },
        addCloseButton: function(_row, _type) {
            _type = _type || 'text';
            this.getTypeEl('a', {
                attr: {
                    class: 'pull-right smView button-reset control-' + _type,
                    href: '#'
                },
                text: 'clear'
            }).appendTo(_row).on('click', function() {
                _row.find('input[type="text"], textarea').val('');
                return false;
            });
        },
        _removeATab: function() {
            var _index = this.tabs.index(this.active);
            var _eventData = {
                index: _index,
                tab: this.active,
                panel: this._getPanelForTab(this.active),
                that: this
            };
            if (this._trigger("beforeRemoveATab", null, _eventData) === false) {
                return false;
            }
            this.options.confirmModal ? this._makeConfirm(_index) : this._processRemoveTab(false, _index);
        },
        _makeConfirm: function(_index) {
            var that = this;
            $('.modal-body', this.confirmModal).html(this.options.confirmModal.message);
            this.confirmModal.modal({backdrop: 'static', keyboard: false})
                    .one('click', '[data-value]', function() {
                        if ($(this).data('value') == '1') {
                            var _id = that.active.find('a').attr('exe');
                            if (_id) {
                                $.ajax({
                                    type: "POST",
                                    url: that._makeUrl(that.options.confirmModal.ajaxUrl),
                                    data: {id: _id}
                                }).done(function() {
                                    that._processRemoveTab(_id, _index);
                                });
                            } else {
                                that._processRemoveTab(_id, _index);
                            }
                        }
                    });
        },
        _processRemoveTab: function(_id, _index) {
            _id = _id || false;

            this.remove(_index);

            this._refreshTab();

            this._trigger("afterRemoveATab", null, {
                index: this.tabs.index(this.active),
                tab: this.active,
                panel: this._getPanelForTab(this.active),
                that: this,
                id: _id
            });
        },
        _refreshTab: function() {
            var that = this;
            this.tabs.map(function(_index, _tab) {
                $(_tab).find('a span').text(_index + 1);
                that._getPanelForTab(_tab).find('textarea, input[type="text"]').map(function(_i, _el) {
                    if (!$(_el).val()) {
                        $(_el).attr('placeholder', function() {
                            return $(this).attr('placeHolderText').replace(/\{label\}/g, (_index + 1));
                        });
                    }
                });
            });
        },
        _getControlRow: function() {
            return this.getTypeEl('div', {
                attr: {
                    class: 'pull-left control-row'
                },
                text: ''
            });
        },
        /*
         * data = {control: {type: '', attr: {}, text: '' }, tooltip: true, required: true, closeButton: true, row: _row}
         */
        _createControl: function(data) {
            var _control = null;
            if (data.control.type === 'upload') {
                return this._makeUploadControl(data);
            } else {
                _control = this.getTypeEl(data.control.type, {
                    attr: data.control.attr,
                    text: data.control.text
                }).appendTo(data.row);
            }

            if (data.tooltip) {
                _control.tooltip(this.options.tooltipTemplate);
            }
            if (data.required) {
                this.getTypeEl('span').addClass('pull-left req').appendTo(data.row);
            }
            if (data.closeButton) {
                this.addCloseButton(data.row);
            }
            return _control;
        },
        _makeUploadControl: function(data) {
            //<input type='hidden' class='validate[required]' name='data[AboutFastgive][" + num_tabs + "][images]' id='name" + num_tabs + "'>\n\
            //<div class='pos_img' id='validate_name" + num_tabs + "'></div>\n\
//<div class='positionRelative bb'> <span class='req'></span>\n\
//</div>\n\
//<div id='file_upload" + num_tabs + "' class='file_upload' exe='" + num_tabs + "' name='data[AboutFastgive][" + num_tabs + "][image]' >Upload Picture</div>\n\
//<ul class='upPic' id='img_text" + num_tabs + "'></ul>\n\

            var _control = this.getTypeEl('div', {
                attr: data.control.attr,
                text: data.control.text
            }).appendTo(data.row);

            if (data.required) {
//                _control.attr('id', this._getMixedId('file_upload-', data.index));
                this.getTypeEl('span').addClass('pull-left req req-right').appendTo(data.row);
                data.row.attr('id', this._getMixedId('validate_img-name-', data.index));
            }

            this.getTypeEl('input', {
                attr: {
                    class: 'validate[required]',
                    id: this._getMixedId('img-name-', data.index),
                    name: data.control.hiddenControlName.replace(/\{index\}/g, data.index),
                    type: 'hidden'
                }
            }).appendTo(data.row);

            this.getTypeEl('ul', {
                attr: {
                    class: 'upPic',
                    id: this._getMixedId('img-text-', data.index)
                },
                text: data.control.text
            }).appendTo(data.row);

            return _control;
        },
        _makeUrl: function(path) {
            return this.options.siteBaseUrl + path;
        }
    });
})(jQuery, window, document);