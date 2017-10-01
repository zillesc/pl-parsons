
define(["PrairieRandom", "PrairieGeom", "QServer", "serverFilesCourse/ParsonsServer", "underscore"], function(PrairieRandom, PrairieGeom, QServer, ParsonsServer, _) {

    var server = new QServer();

    // question parameters
    var initial = "def is_true(boolean_value):\n" +
                  "  if boolean_value:\n" +
                  "    return True\n" +
                  "  return False\n" +
                  "  return true #distractor\n" 

    server.getData = function(vid, options) {
        var rand = new PrairieRandom.RandomGenerator(vid);

        var parsonsState = ParsonsServer.parseCode(options.code, options.max_distractors, rand);
//        console.log(parsonsState);

        var params = {
            prompt: options.prompt,
            lines: _.map(parsonsState.all_lines, function(item) { return _.pick(item, "code", "id"); }),
        };

        // correct answer to the question
        var trueAnswer = {
            toshow: _.map(parsonsState.solution, 'orig_code').join('\n'),
            solution: parsonsState.solution,
            all_lines: parsonsState.all_lines,
        };

        // all the question data together
        var questionData = {
            params: params,
            trueAnswer: trueAnswer,
        };
        return questionData;
    };

    // OPTIONAL gradeAnswer() function
    // if not present, then the submittedAnswer will be automatically checked against the trueAnswer
    server.gradeAnswer = function(vid, params, trueAnswer, submittedAnswer, options) {
        var score = 1;
        var feedback_text = '';
        var feedback_count = options.max_feedback_count || 3;

        var feedback = function(text) {
            if ((feedback_count --) > 0) {
                feedback_text += text;
            }
        };

        if (!submittedAnswer.answerLines || (submittedAnswer.answerLines === '-')) {
            score = 0;
            feedback_text = "There were no lines in the submission window.";
        } else {
            var answer = submittedAnswer.answerLines.split('-');
            var solution_length = trueAnswer.solution.length;
            if (answer.length < solution_length) {
                score = 0;
                feedback('You submitted too few lines.  ');
            }
            if (answer.length > solution_length) {
                score = 0;
                feedback('You submitted too many lines.  ');
            }
            _.each(answer, function(encoded, index) {
                if (index >= solution_length) {
                    return;
                }
                var disaggregated = encoded.split(':');
                var item = disaggregated[0];
                var indent = disaggregated[1];
                if (item !== trueAnswer.solution[index].id) {
                    score = 0;
                    feedback('Line ' + index + ' was incorrect.  ');
                } else if (options.check_indentation && (indent != trueAnswer.solution[index].indent)) {
                    score = 0;
                    feedback('Line ' + index + ' has incorrect indentation.  ');
                }
            });
            if (feedback_text) {
                feedback_text = 'Problems include: ' + feedback_text;
            }
        }

       
        
        return {score: score, feedback: { 'text': feedback_text } };
    };

    return server;
});
