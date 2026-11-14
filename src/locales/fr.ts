import type { Message } from "@/lib/i18n";

import type { MessageKey } from "./en";
// Français. Première traduction, à faire relire par un locuteur natif.
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
import * as coach from "./text/coach";
import * as conn from "./text/conn";
import * as cos from "./text/cos";
import * as count from "./text/count";
import * as cpl from "./text/cpl";
import * as creator from "./text/creator";
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
import * as fit from "./text/fit";
import * as fix from "./text/fix";
import * as fmt from "./text/fmt";
import * as friends from "./text/friends";
import * as ft from "./text/ft";
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
import * as variety from "./text/variety";
import * as vc from "./text/vc";
import * as vl from "./text/vl";
import * as warm from "./text/warm";
import * as wdg from "./text/wdg";
import * as why from "./text/why";
import * as wk from "./text/wk";
import * as workout from "./text/workout";
import * as x from "./text/x";

export const fr: Partial<Record<MessageKey, Message>> = {
  ...a11y.fr,
  ...account.fr,
  ...ach.fr,
  ...activity.fr,
  ...advice.fr,
  ...appearance.fr,
  ...awards.fr,
  ...band.fr,
  ...bk.fr,
  ...block.fr,
  ...bmi.fr,
  ...body.fr,
  ...buddy.fr,
  ...buy.fr,
  ...cal.fr,
  ...calc.fr,
  ...card.fr,
  ...callText.fr,
  ...category.fr,
  ...cause.fr,
  ...chk.fr,
  ...coach.fr,
  ...conn.fr,
  ...cos.fr,
  ...count.fr,
  ...cpl.fr,
  ...creator.fr,
  ...cycle.fr,
  ...dash.fr,
  ...delight.fr,
  ...demo.fr,
  ...done.fr,
  ...dots.fr,
  ...equipment.fr,
  ...ex.fr,
  ...exp.fr,
  ...explain.fr,
  ...extra.fr,
  ...fb.fr,
  ...fit.fr,
  ...fix.fr,
  ...fmt.fr,
  ...ft.fr,
  ...friends.fr,
  ...game.fr,
  ...ghost.fr,
  ...gl.fr,
  ...gloss.fr,
  ...goal.fr,
  ...gp.fr,
  ...gym.fr,
  ...hr.fr,
  ...imp.fr,
  ...info.fr,
  ...inj.fr,
  ...ins.fr,
  ...lab.fr,
  ...league.fr,
  ...link.fr,
  ...lvl.fr,
  ...map.fr,
  ...mom.fr,
  ...month.fr,
  ...msg.fr,
  ...msgKind.fr,
  ...muscle.fr,
  ...nav.fr,
  ...note.fr,
  ...notes.fr,
  ...now.fr,
  ...orm.fr,
  ...part.fr,
  ...past.fr,
  ...pay.fr,
  ...pgm.fr,
  ...photos.fr,
  ...plate.fr,
  ...pm.fr,
  ...pol.fr,
  ...pr.fr,
  ...pro.fr,
  ...prog.fr,
  ...progress.fr,
  ...pub.fr,
  ...push.fr,
  ...quest.fr,
  ...quote.fr,
  ...rarity.fr,
  ...recap.fr,
  ...recovery.fr,
  ...remix.fr,
  ...rmd.fr,
  ...rt.fr,
  ...save.fr,
  ...sband.fr,
  ...sea.fr,
  ...settings.fr,
  ...setup.fr,
  ...share.fr,
  ...sig.fr,
  ...social.fr,
  ...str.fr,
  ...stats.fr,
  ...tab.fr,
  ...td.fr,
  ...tempo.fr,
  ...timer.fr,
  ...tdee.fr,
  ...theme.fr,
  ...team.fr,
  ...tier.fr,
  ...time.fr,
  ...today.fr,
  ...ton.fr,
  ...egg.fr,
  ...hx.fr,
  ...lift.fr,
  ...tools.fr,
  ...train.fr,
  ...trl.fr,
  ...trn.fr,
  ...twin.fr,
  ...units.fr,
  ...variety.fr,
  ...vc.fr,
  ...vl.fr,
  ...warm.fr,
  ...wdg.fr,
  ...why.fr,
  ...wk.fr,
  ...workout.fr,
  ...x.fr,
};
