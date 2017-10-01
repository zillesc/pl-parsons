define(['jquery', 'underscore', 'clientFilesCourse/jquery-ui.min', 'clientFilesCourse/prettify', 'clientFilesCourse/jquery.ui.touch-punch.min'], function($, _, jqueryui, prettify, jquery_touch_punch) {

    var parsons = {
        options: { can_indent: true, x_indent: 50 },
        lines: [],
        answer_lines: '-',
        answer_contents: '',
    };

    parsons.set_answer = function() {
        this.answer.set({ 'answerLines': this.answer_lines, 'answerContents': this.answer_contents });
    };

    parsons.set_answer_lines = function(sortableId) {
        var dom_objs = $('#ul-' + sortableId).children();
        var ids = _.map(dom_objs, function(obj) { return obj.id + ':' + parsons.getLineById(obj.id).indent; });
        this.answer_lines = ids ? ids.join('-') : '-';
        console.log(this.answer_lines);
        
        var contents = '';
        _.each(dom_objs, function(obj) {
            var lineObject = parsons.getLineById(obj.id);
            _.times(lineObject.indent, function() { contents += '  '; });
            contents += lineObject.code + '\n';
        });
        this.answer_contents = contents;
        console.log(contents);

        this.set_answer();
    }

    parsons.registerAnswerObject = function(answerObject) {
        this.answer = answerObject;
    };

    parsons.getLineById = function(id) {
        return _.find(this.lines, { 'id': id });
    };
    
    var lineToHTML = function(line) {
        return '<li id="' + line.id + '" class="prettyprint lang-py">' + line.code + '<\/li>';
    };
    
    parsons.initializeLines = function(lines, container_id) {
        var contents = '';
        if (lines !== null) {
            _.each(lines, function(line) { line.indent = 0; });
            contents =  _.map(lines, lineToHTML).join('');
            this.lines = lines;
        }
        var html = '<ul id="ul-' + container_id + '">' + contents + '</ul>';
        $("#" + container_id).html(html);
    };
    
    parsons.initializeEmpty = function(container_id) {
        parsons.initializeLines(null, container_id);
    };

    parsons.restorePreviousAnswer = function(sortableId, trashId) {
        var target = $('#ul-' + sortableId);

        var answerLines = this.answer.get('answerLines');
        if (answerLines) {
            var ids = answerLines.split('-');
            _.each(ids, function(encoded) {
                var disaggregated = encoded.split(':');
                var id = disaggregated[0];
                var indent = disaggregated[1];
                $('#' + id).appendTo(target);
                parsons.getLineById(id).indent = indent;
                parsons.updateHTMLIndent(id);
            });
        }
    }
    
    parsons.clearFeedback = function(sortableId) {
        return;
        
//         if (this.feedback_exists) {
//             $("#ul-" + sortableId).removeClass("incorrect correct");
//             var li_elements = $("#ul-" + sortableId + " li");
//             $.each(this.FEEDBACK_STYLES, function(index, value) {
//                 li_elements.removeClass(value);
//             });
//         }
//         this.feedback_exists = false;
    };

    parsons.updateIndent = function(leftDiff, id) {
        var code_line = this.getLineById(id);
        var new_indent = this.options.can_indent ? code_line.indent + Math.floor(leftDiff / this.options.x_indent) : 0;
        new_indent = Math.max(0, new_indent);
        code_line.indent = new_indent;
        return new_indent;
    };

    parsons.updateHTMLIndent = function(id) {
        var line = this.getLineById(id);
        $('#' + id).css("margin-left", this.options.x_indent * line.indent + "px");
    };

    parsons.addLogEntry = function(entry) {
        var state, previousState;
        var logData = {
            time: new Date(),
            output: this.solutionHash(),
            type: "action"
        };

        if (this.options.trashId) {
            logData.input = this.trashHash();
        }
        
        if (entry.target) {
            entry.target = entry.target.replace(this.id_prefix, "");
        }
        
        // add toggle states to log data if there are toggles
        var toggles = this._getToggleStates();
        if (toggles) {
            logData.toggleStates = toggles;
        }
        
        state = logData.output;
        
        jQuery.extend(logData, entry);
        this.user_actions.push(logData);
        
        //Updating the state history
        if (this.state_path.length > 0) {
            previousState = this.state_path[this.state_path.length - 1];
            this.states[previousState] = logData;
        }
        
        //Add new item to the state path only if new and previous states are not equal
        if (this.state_path[this.state_path.length - 1] !== state) {
            this.state_path.push(state);
        }
        // callback for reacting to actions
        if ($.isFunction(this.options.action_cb)) {
            this.options.action_cb.call(this, logData);
        }
    };

    parsons.addSortableFunctionalityToHTML = function(sortableId, trashId) {
        if (window.prettyPrint) { 
            prettyPrint();
        }

        var sortable_functions = {
            start: function() { 
//                parsons.clearFeedback(sortableId); 
            },
            stop: function(event, ui) {
                if ($(event.target)[0] != ui.item.parent()[0]) {
                    return;
                }
                parsons.updateIndent(ui.position.left - ui.item.parent().position().left, ui.item[0].id);
                parsons.updateHTMLIndent(ui.item[0].id);
                parsons.set_answer_lines(sortableId);
//                 parsons.addLogEntry({type: "moveOutput", target: ui.item[0].id}, true);
            },
            receive: function(event, ui) {
                var ind = parsons.updateIndent(ui.position.left - ui.item.parent().position().left, ui.item[0].id);
                parsons.updateHTMLIndent(ui.item[0].id);
                parsons.set_answer_lines(sortableId);
//                 parsons.addLogEntry({type: "addOutput", target: ui.item[0].id}, true);
            },
            grid: this.options.can_indent ? [this.options.x_indent, 1 ] : false
        };
        var sortable = $("#ul-" + sortableId);
        sortable.sortable(sortable_functions).addClass("output");

        if (trashId) {
            var trash_functions = {
                connectWith: sortable,
                start: function() { 
//                     parsons.clearFeedback(); 
                },
                receive: function(event, ui) {
                    parsons.getLineById(ui.item[0].id).indent = 0;
                    parsons.updateHTMLIndent(ui.item[0].id);
                    parsons.set_answer_lines(sortableId);
//                    parsons.addLogEntry({type: "removeOutput", target: ui.item[0].id}, true);
                },
                stop: function(event, ui) {
//                     if ($(event.target)[0] != ui.item.parent()[0]) {
//                         // line moved to output and logged there
//                         return;
//                     }
//                     parsons.addLogEntry({type: "moveInput", target: ui.item[0].id}, true);
                }
            };

            var trash = $("#ul-" + trashId).sortable(trash_functions);
            sortable.sortable('option', 'connectWith', trash);
        }
    };

    parsons.setup = function(containerId, lines, sortableId, trashId) {
        var divs = '<div id="sortableTrash" class="sortable-code"></div>' + 
                   '<div id="sortable" class="sortable-code"></div>';
        $("#" + containerId).html(divs);

        parsons.initializeLines(lines, trashId);
        parsons.initializeEmpty(sortableId);
        parsons.restorePreviousAnswer(sortableId, trashId);
        parsons.addSortableFunctionalityToHTML(sortableId, trashId);
    };

    return parsons;
});
