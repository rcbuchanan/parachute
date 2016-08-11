"use strict";

var _ = require("underscore");

var Parachute = function (svg) {
    this.svgRoot = svg.target;

    this.mouseEscape = false;
    this.headLock = false;

    this.headPos = 0;
    this.hideyPos = 0;
    
    this.bladesVisible = [false, false];
    
    this.DISP = {}
    for (var g in this.DISP_SEG) {
	this.DISP[g] = new Array(this.DISP_SEG[g].length);
        for (var i = 0; i < this.DISP_SEG[g].length; i++) {
	    console.log(this.DISP_SEG[g][i]);
	    var e = this.DISP[g][i] = this.svgRoot.getElementById(this.DISP_SEG[g][i]);
	    e.seton = function (t) {
		this.style.fill = t ? Parachute.prototype.DISP_ON_COLOR : Parachute.prototype.DISP_OFF_COLOR;
		this.ison = t;
	    };
	    e.seton(false);
        }
    }

    this.attachKeyListener();
};

Parachute.prototype.DISP_ON_COLOR = "#000000";
Parachute.prototype.DISP_OFF_COLOR = "#CCCCCC";
Parachute.prototype.DISP_SEG = {
    top: ["top_1", "top_2", "top_3", "top_4", "top_5", "top_6", "top_7"],
    middle : ["middle_1", "middle_2", "middle_3", "middle_4", "middle_5", "middle_6"],
    bottom : ["bottom_1", "bottom_2", "bottom_3", "bottom_4", "bottom_5"],
    swinger : ["swinger_1", "swinger_2"],
    drown : ["drown_1", "drown_2", "drown_3", "drown_4", "drown_5", "drown_6"],
    jaw_open: ["jaw_1_open", "jaw_2_open", "jaw_3_open"],
    jaw_closed: ["jaw_1_closed", "jaw_2_closed", "jaw_3_closed"],
    ded: ["ded_1", "ded_2", "ded_3"],
    head: ["head_1", "head_2", "head_3"],
    body: ["body_1", "body_2", "body_3", "body_4"],
    hidey : ["hidey_3", "hidey_2", "hidey_1"],
    hand : ["hand_1", "hand_2"]
};

Parachute.prototype.CHUTE_DELAY = 500;
Parachute.prototype.SPAWN_DELAY = 800;
Parachute.prototype.VANISH_DELAY = 100;
Parachute.prototype.BLADE_DELAYS = [561, 620];
Parachute.prototype.SWIM_DELAYS = {move: 500, lurk: 12000};

Parachute.prototype.run = function () {
    this.startHead();
    this.startChutes();
};

Parachute.prototype.moveHead = function (keyCode) {
    // check if chutes need to be collected
    var activePath;
    var lasti;
    
    switch (this.headPos) {
    case 0:
	activePath = this.DISP.top;
	lasti = this.DISP.top.length - 1;
	break;
    case 1:
	activePath = this.DISP.middle;
	lasti = this.DISP.middle.length - 1;
	break;
    case 2:
	activePath = this.DISP.bottom;
	lasti = this.DISP.bottom.length - 1;
	break;
    }

    if (activePath[lasti].ison && !this.mouseEscape) {
	var vanish = function() {
	    activePath[lasti].seton(false);
	};
	
	activePath[lasti].saved = true;
	setTimeout(_.bind(vanish, this), this.VANISH_DELAY);
    }

    if (this.headLock) {
	return;
    }
    
    var setHeadSegs = _.bind(function (oldPos, newPos) {
	// off with the old...
	this.DISP.head[oldPos].seton(false);
	this.DISP.jaw_open[oldPos].seton(false);
	this.DISP.jaw_closed[oldPos].seton(false);

	// on with the new...
	this.DISP.head[newPos].seton(true);
	this.DISP.jaw_open[newPos].seton(true);
	this.DISP.jaw_closed[newPos].seton(false);

	this.DISP.body[1].seton(true);
	if (newPos == 0) {
	    this.DISP.body[0].seton(false);
	    this.DISP.body[2].seton(true);
	    this.DISP.body[3].seton(false);
	} else {
	    this.DISP.body[0].seton(true);
	    this.DISP.body[2].seton(false);
	    this.DISP.body[3].seton(true);
	}
	
    }, this);

    // move
    switch (keyCode) {
    case 39:
	if (this.headPos >= this.DISP.head.length - 1) {
	    break;
	}

	setHeadSegs(this.headPos, this.headPos + 1);
	this.headPos++;
	break;
    case 37:
	if (this.headPos <= 0)
	    break;

	setHeadSegs(this.headPos, this.headPos - 1);
	this.headPos--;
	break;
    case 0:
	setHeadSegs(this.headPos, this.headPos);
    default:
	break;
    }
};

Parachute.prototype.attachKeyListener = function () {
    var callback = function (evt) {
	setTimeout(_.bind(this.moveHead, this), 0, evt.keyCode);
    };
    this.svgRoot.addEventListener("keydown", _.bind(callback, this));
};

Parachute.prototype.startHead = function () {
    this.moveHead(0);
};

Parachute.prototype.startChutes = function () {
    function addChute () {
	if (this.mouseEscape) {
	    // time freezes when drowning is happening. Check back later.
	} else {
	    // check available starting points
	    var es = [];
	    for (var t in {top:"", middle:"", bottom:""}) {
		if (!this.DISP[t][0].ison && !this.DISP[t][1].ison) {
		    es.push(this.DISP[t]);
		}
	    }

	    // pick one and schedule a moveChute
	    if(es.length == 0) {
		console.log("TOO SOON!!! PROBABLY BREAKING EVERYTHING!!!!");
	    } else {
		var e = es[Math.floor(Math.random() * es.length)];
		e[0].seton(true);
		setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, e, 0);
	    }
	}

	setTimeout(_.bind(addChute, this), this.SPAWN_DELAY);
    }

    function moveChute(activePath, i) {
	// time freezes when drowning is happening. Reschedule.
	if (this.mouseEscape) {
	    setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, activePath, i);
	    return;
	}

	if (activePath[i].saved) {
	    // Head already saved us
	    
	    delete activePath[i].saved;
	} else if (activePath == this.DISP.bottom && i == 1 &&
	    // at this.DISP.bottom[1], should we swing?
	    
	    !this.DISP.swinger[0].ison && !this.DISP.swinger[1].ison &&
	    Math.random() > 0.3) {
	    activePath[i].seton(false);
	    this.DISP.swinger[0].seton(true);
	    setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, this.DISP.swinger, 0);
	} else if (activePath == this.DISP.swinger && i == 0 &&
		   !this.DISP.bottom[3].ison && !this.DISP.bottom[2].ison &&
		   !this.DISP.bottom[1].ison && Math.random() > 0.65) {
	    // swinging... we should release
	    
	    this.DISP.bottom[3].seton(true);
	    this.DISP.swinger[0].seton(false);
	    setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, this.DISP.bottom, 2);
	} else if (activePath == this.DISP.swinger) {
	    // swinging... keep swinging
	    
	    activePath[i].seton(false);
	    i = (i + 1) % this.DISP.swinger.length;
	    activePath[i].seton(true);
	    setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, activePath, i);
	} else if (i < activePath.length - 1) {
	    // not at bottom of path; continue
	    
	    activePath[i].seton(false);
	    activePath[++i].seton(true);
	    setTimeout(_.bind(moveChute, this), this.CHUTE_DELAY, activePath, i);
	} else if ((activePath == this.DISP.top && this.DISP.head[0].ison) ||
		   (activePath == this.DISP.middle && this.DISP.head[1].ison) ||
		   (activePath == this.DISP.bottom && this.DISP.head[2].ison)) {
	    // at bottom of path

	    this.headLock = false;
	    var vanishCb = function (obj) {
		// make it be eaten
		obj.seton(false);
		this.DISP.jaw_closed[this.headPos].seton(true);
		this.DISP.jaw_open[this.headPos].seton(false);
		this.DISP.ded[this.headPos].seton(true);

		// open jaw again
		setTimeout(_.bind(function () {
		    this.DISP.jaw_closed[this.headPos].seton(false);
		    this.DISP.jaw_open[this.headPos].seton(true);
		    this.DISP.ded[this.headPos].seton(false);
		    this.headLock = false;
		}, this), this.VANISH_DELAY);
	    };
	    setTimeout(_.bind(vanishCb, this), this.VANISH_DELAY, activePath[i]);
	} else {
	    // he ded
	    
	    this.feedFish(activePath, i);
	}
    }

    _.bind(addChute, this)();
}


Parachute.prototype.feedFish = function (activePath, i) {
    this.mouseEscape = true;
    activePath[i].seton(false);

    function deathChase (frame) {
	var done = false;
	
	if (frame <= 0) {
	    this.DISP.drown[frame].seton(true);
	} else if (frame == 1) {
	    this.DISP.drown[frame].seton(true);
	    this.DISP.drown[frame - 1].seton(false);
	} else if (frame > 1 && frame < 6) {
	    this.DISP.drown[frame - 1].seton(false);
	    this.DISP.drown[frame].seton(true);
	} else {
	    this.DISP.drown[frame - 1].seton(false);
	    this.DISP.hidey[this.hideyPos++].seton(true);
	    if (this.hideyPos < this.DISP.hidey.length) {
		this.mouseEscape = false;
	    }
	    done = true;
	}

	if (!done) {
	    setTimeout(_.bind(deathChase, this), this.SWIM_DELAYS.move, frame + 1);
	}
    }

    if (activePath == this.DISP.bottom) {
	_.bind(deathChase, this)(0)
    } else if(activePath == this.DISP.middle) {
	_.bind(deathChase, this)(1);
    } else {
	_.bind(deathChase, this)(2);
    }
};

module.exports = {}
module.exports.run = function (svg) {
    var parachute = new Parachute(svg);
    parachute.run();
};
