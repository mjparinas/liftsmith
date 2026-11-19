import type { Message } from "@/lib/i18n";

import type { MessageKey } from "./en";
// Türkçe. Makine çevirisi.
// The text is in src/locales/text/<prefix>.ts, beside the English.

import * as a11y from "./text/a11y";
import * as account from "./text/account";
import * as ach from "./text/ach";
import * as activity from "./text/activity";
import * as advice from "./text/advice";
import * as appearance from "./text/appearance";
import * as awards from "./text/awards";
import * as band from "./text/band";
import * as bk from "./text/bk";
import * as block from "./text/block";
import * as bmi from "./text/bmi";
import * as body from "./text/body";
import * as buddy from "./text/buddy";
import * as buy from "./text/buy";
import * as cal from "./text/cal";
import * as calc from "./text/calc";
import * as callText from "./text/callText";
import * as card from "./text/card";
import * as category from "./text/category";
import * as cause from "./text/cause";
import * as chk from "./text/chk";
import * as cmty from "./text/cmty";
import * as coach from "./text/coach";
import * as conn from "./text/conn";
import * as cos from "./text/cos";
import * as count from "./text/count";
import * as cpg from "./text/cpg";
import * as cpl from "./text/cpl";
import * as creator from "./text/creator";
import * as crew from "./text/crew";
import * as cycle from "./text/cycle";
import * as dash from "./text/dash";
import * as delight from "./text/delight";
import * as demo from "./text/demo";
import * as done from "./text/done";
import * as dots from "./text/dots";
import * as egg from "./text/egg";
import * as equipment from "./text/equipment";
import * as ex from "./text/ex";
import * as exp from "./text/exp";
import * as explain from "./text/explain";
import * as extra from "./text/extra";
import * as fb from "./text/fb";
import * as ff from "./text/ff";
import * as fit from "./text/fit";
import * as fix from "./text/fix";
import * as fmt from "./text/fmt";
import * as food from "./text/food";
import * as friends from "./text/friends";
import * as ft from "./text/ft";
import * as fv from "./text/fv";
import * as game from "./text/game";
import * as ghost from "./text/ghost";
import * as gl from "./text/gl";
import * as gloss from "./text/gloss";
import * as goal from "./text/goal";
import * as gp from "./text/gp";
import * as gym from "./text/gym";
import * as hr from "./text/hr";
import * as hx from "./text/hx";
import * as imp from "./text/imp";
import * as info from "./text/info";
import * as inj from "./text/inj";
import * as ins from "./text/ins";
import * as lab from "./text/lab";
import * as league from "./text/league";
import * as lift from "./text/lift";
import * as link from "./text/link";
import * as lvl from "./text/lvl";
import * as map from "./text/map";
import * as mom from "./text/mom";
import * as month from "./text/month";
import * as msg from "./text/msg";
import * as msgKind from "./text/msgKind";
import * as muscle from "./text/muscle";
import * as nav from "./text/nav";
import * as note from "./text/note";
import * as notes from "./text/notes";
import * as now from "./text/now";
import * as orm from "./text/orm";
import * as part from "./text/part";
import * as past from "./text/past";
import * as pay from "./text/pay";
import * as pgm from "./text/pgm";
import * as phase from "./text/phase";
import * as photos from "./text/photos";
import * as plate from "./text/plate";
import * as pm from "./text/pm";
import * as pol from "./text/pol";
import * as pr from "./text/pr";
import * as pro from "./text/pro";
import * as prog from "./text/prog";
import * as progress from "./text/progress";
import * as pub from "./text/pub";
import * as push from "./text/push";
import * as quest from "./text/quest";
import * as quote from "./text/quote";
import * as rarity from "./text/rarity";
import * as recap from "./text/recap";
import * as recovery from "./text/recovery";
import * as remix from "./text/remix";
import * as rev from "./text/rev";
import * as rhp from "./text/rhp";
import * as rmd from "./text/rmd";
import * as rt from "./text/rt";
import * as save from "./text/save";
import * as sband from "./text/sband";
import * as sea from "./text/sea";
import * as settings from "./text/settings";
import * as setup from "./text/setup";
import * as share from "./text/share";
import * as sig from "./text/sig";
import * as social from "./text/social";
import * as ssn from "./text/ssn";
import * as stats from "./text/stats";
import * as str from "./text/str";
import * as tab from "./text/tab";
import * as td from "./text/td";
import * as tdee from "./text/tdee";
import * as team from "./text/team";
import * as tempo from "./text/tempo";
import * as theme from "./text/theme";
import * as tier from "./text/tier";
import * as time from "./text/time";
import * as timer from "./text/timer";
import * as today from "./text/today";
import * as ton from "./text/ton";
import * as tools from "./text/tools";
import * as train from "./text/train";
import * as trl from "./text/trl";
import * as trn from "./text/trn";
import * as twin from "./text/twin";
import * as units from "./text/units";
import * as unl from "./text/unl";
import * as variety from "./text/variety";
import * as vc from "./text/vc";
import * as vl from "./text/vl";
import * as warm from "./text/warm";
import * as wdg from "./text/wdg";
import * as why from "./text/why";
import * as wk from "./text/wk";
import * as wn from "./text/wn";
import * as workout from "./text/workout";
import * as x from "./text/x";

export const tr: Partial<Record<MessageKey, Message>> = {
  ...a11y.tr,
  ...account.tr,
  ...ach.tr,
  ...activity.tr,
  ...advice.tr,
  ...appearance.tr,
  ...awards.tr,
  ...band.tr,
  ...bk.tr,
  ...block.tr,
  ...bmi.tr,
  ...body.tr,
  ...buddy.tr,
  ...crew.tr,
  ...fv.tr,
  ...buy.tr,
  ...cal.tr,
  ...calc.tr,
  ...card.tr,
  ...callText.tr,
  ...category.tr,
  ...cause.tr,
  ...chk.tr,
  ...coach.tr,
  ...cmty.tr,
  ...conn.tr,
  ...cos.tr,
  ...count.tr,
  ...cpl.tr,
  ...creator.tr,
  ...cycle.tr,
  ...dash.tr,
  ...delight.tr,
  ...demo.tr,
  ...done.tr,
  ...dots.tr,
  ...equipment.tr,
  ...ex.tr,
  ...exp.tr,
  ...explain.tr,
  ...extra.tr,
  ...fb.tr,
  ...ff.tr,
  ...fit.tr,
  ...fix.tr,
  ...fmt.tr,
  ...food.tr,
  ...ft.tr,
  ...friends.tr,
  ...game.tr,
  ...ghost.tr,
  ...gl.tr,
  ...gloss.tr,
  ...goal.tr,
  ...gp.tr,
  ...gym.tr,
  ...hr.tr,
  ...imp.tr,
  ...info.tr,
  ...inj.tr,
  ...ins.tr,
  ...lab.tr,
  ...league.tr,
  ...link.tr,
  ...lvl.tr,
  ...map.tr,
  ...mom.tr,
  ...month.tr,
  ...msg.tr,
  ...msgKind.tr,
  ...muscle.tr,
  ...nav.tr,
  ...note.tr,
  ...notes.tr,
  ...now.tr,
  ...orm.tr,
  ...part.tr,
  ...past.tr,
  ...pay.tr,
  ...pgm.tr,
  ...photos.tr,
  ...plate.tr,
  ...pm.tr,
  ...pol.tr,
  ...pr.tr,
  ...pro.tr,
  ...prog.tr,
  ...progress.tr,
  ...pub.tr,
  ...push.tr,
  ...quest.tr,
  ...quote.tr,
  ...rarity.tr,
  ...recap.tr,
  ...recovery.tr,
  ...remix.tr,
  ...cpg.tr,
  ...rev.tr,
  ...rmd.tr,
  ...rhp.tr,
  ...rt.tr,
  ...save.tr,
  ...sband.tr,
  ...sea.tr,
  ...ssn.tr,
  ...settings.tr,
  ...setup.tr,
  ...share.tr,
  ...sig.tr,
  ...social.tr,
  ...str.tr,
  ...stats.tr,
  ...tab.tr,
  ...td.tr,
  ...phase.tr,
  ...tempo.tr,
  ...timer.tr,
  ...tdee.tr,
  ...theme.tr,
  ...team.tr,
  ...tier.tr,
  ...time.tr,
  ...today.tr,
  ...ton.tr,
  ...egg.tr,
  ...unl.tr,
  ...wn.tr,
  ...hx.tr,
  ...lift.tr,
  ...tools.tr,
  ...train.tr,
  ...trl.tr,
  ...trn.tr,
  ...twin.tr,
  ...units.tr,
  ...variety.tr,
  ...vc.tr,
  ...vl.tr,
  ...warm.tr,
  ...wdg.tr,
  ...why.tr,
  ...wk.tr,
  ...workout.tr,
  ...x.tr,
};
