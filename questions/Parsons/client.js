
define(["SimpleClient", "text!./question.html", "text!./answer.html", "text!./submission.html", "clientFilesCourse/ParsonsClient",], function(SimpleClient, questionTemplate, answerTemplate, submissionTemplate, ParsonsClient) {

    var client = new SimpleClient.SimpleClient({questionTemplate: questionTemplate, answerTemplate: answerTemplate, submissionTemplate: submissionTemplate});

    client.on("renderQuestionFinished", function() {
        var lines = this.params.get("lines");

        // set up things so that an answer can be submitted
        ParsonsClient.registerAnswerObject(client.submittedAnswer);
        client.addAnswer("answerLines");
        client.addAnswer("answerContents");
        // this.addAnswer("feedback");

        ParsonsClient.setup('container', lines, 'sortable', 'sortableTrash');
    });

    return client;

});
