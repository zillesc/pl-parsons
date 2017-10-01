define(['underscore'], function(_) {

    var parsons = {};

    var trimRegexp = /^\s*(.*?)\s*$/;

    // Create a line object skeleton with only code and indentation from
    // a code string of an assignment definition string (see parseCode)
    var ParsonsCodeline = function(codestring, index) {
        this.orig_code = codestring;
        this.indent = -1;
        this.orig = index;
        this.code = '';
        this.raw_indent = 0;

        // Consecutive lines to be dragged as a single block of code have strings "\\n" to
        // represent newlines => replace them with actual new line characters "\n"
        if (codestring) {
            this.code = codestring.replace(/#distractor\s*$/, "").replace(trimRegexp, "$1").replace(/\\n/g, "\n");
            this.raw_indent = codestring.length - codestring.replace(/^\s+/, "").length;
        }
    };



    // Check and normalize code indentation.  If indentation does not match,
    // i.e. code is malformed, value of indent may be -1.
    var normalizeIndents = function(lines) {
        if (lines.length < 1) {
            throw 'no lines';
        }

        if (lines[0].raw_indent !== 0) {
            throw 'first line may not be indented';
        }

        lines[0].indent = 0;          

        for (var i = 1; i < lines.length; i++) {
            var my_raw_indent = lines[i].raw_indent;
            var prev_raw_indent = lines[i-1].raw_indent;
            
            if (my_raw_indent === prev_raw_indent) {
                lines[i].indent = lines[i-1].indent;
            } else if (my_raw_indent > prev_raw_indent) {
                lines[i].indent = lines[i-1].indent + 1;
            } else {
                // set indent to the previous lines with matching indentation
                // indentation can be -1 if no matching indentation exists, i.e. IndentationError in Python
                for (var j = i-1; j >= 0; j--) {
                    if (lines[j].raw_indent === lines[i].raw_indent) {
                        lines[i].indent = lines[j].indent;
                        break;
                    }
                }
            }
        }
    };

    // Parses an assignment definition given as a string and returns and
    // transforms this into an object defining the assignment with line objects.
    //
    // lines: A string that defines the solution to the assignment and also
    //   any possible distractors
    // max_distractrors: The number of distractors allowed to be included with
    //   the lines required in the solution
    parsons.parseCode = function(lines, max_distractors, rand) {
        var solution = [];
        var distractors = [];
        
        // Create line objects out of each codeline and separate
        // lines belonging to the solution and distractor lines
        // Fields in line objects:
        //   code: a string of the code, may include newline characters and
        //     thus in fact represents a block of consecutive lines
        //   indent: indentation level, -1 for distractors
        //   distractor: boolean whether this is a distractor
        //   orig: the original index of the line in the assignment definition string,
        //     for distractors this is not meaningful but for lines belonging to the
        //     solution, this is their expected position
        _.each(lines, function(item, index) { 
            var line = new ParsonsCodeline(item, index);

            if (item.search(/#distractor\s*$/) >= 0) {
                // This line is a distractor
                line.indent = -1;
                line.distractor = true;
                if (line.code.length > 0) {
                    // The line is non-empty, not just whitespace
                    distractors.push(line);
                }
            } else {
                // This line is part of the solution
                // Initialize line object with code and indentation properties
                if (line.code.length > 0) {
                    // The line is non-empty, not just whitespace
                    line.distractor = false;
                    solution.push(line);
                }
            }
        });

        normalizeIndents(solution);

        _.each(solution, function(item, index) {
            if (item.indent < 0) {
                // Indentation error
                throw 'line #' + item.orig + ' has indentation error';
            }
        });

        // Remove extra distractors if there are more alternative distrators
        // than should be shown at a time
        max_distractors = Math.min(max_distractors, distractors.length);
        var selected_distractors = rand.randNElem(max_distractors, distractors);

        var all_lines = _.union(solution, selected_distractors);
        rand.shuffle(all_lines);
        _.each(all_lines, function(item, index) {
            item.id = "line" + index;
        });

        return {
            // an array of line objects specifying  the solution
            solution:  solution,
            // an array of line objects specifying the requested number
            // of distractors (not all possible alternatives)
            distractors: selected_distractors,
            // an array of line objects specifying the initial code arrangement
            // given to the user to use in constructing the solution
            all_lines: all_lines,
        };
    };
    
    return parsons;
});
