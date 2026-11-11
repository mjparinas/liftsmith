// English, the source language. Plurals use the platform's plural rules (Intl.PluralRules): give
// `one` and `other`, and the forms other languages need (few, many) in theirs. Placeholders are
// {name}; numbers passed in are formatted for the language.
//
// The text lives in src/locales/text/<prefix>.ts, one file per key prefix with every language in
// it ("workout.logSet" is in text/workout.ts), so changes to different screens never touch the
// same file. A new prefix gets a new file, imported here, in es.ts and in fr.ts (in A to Z order).

import * as a11y from "./text/a11y";
import * as account from "./text/account";
import * as ach from "./text/ach";
import * as activity from "./text/activity";
import * as advice from "./text/advice";
import * as appearance from "./text/appearance";
import * as awards from "./text/awards";
import * as band from "./text/band";
import * as block from "./text/block";
import * as bmi from "./text/bmi";
import * as body from "./text/body";
import * as buddy from "./text/buddy";
import * as buy from "./text/buy";
import * as cal from "./text/cal";
import * as callText from "./text/callText";
import * as card from "./text/card";
import * as category from "./text/category";
import * as cause from "./text/cause";
import * as coach from "./text/coach";
import * as conn from "./text/conn";
import * as cos from "./text/cos";
import * as count from "./text/count";
import * as creator from "./text/creator";
import * as cycle from "./text/cycle";
import * as dash from "./text/dash";
import * as delight from "./text/delight";
import * as demo from "./text/demo";
import * as done from "./text/done";
import * as dots from "./text/dots";
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
import * as game from "./text/game";
import * as ghost from "./text/ghost";
import * as gl from "./text/gl";
import * as gloss from "./text/gloss";
import * as goal from "./text/goal";
import * as gym from "./text/gym";
import * as hr from "./text/hr";
import * as imp from "./text/imp";
import * as info from "./text/info";
import * as inj from "./text/inj";
import * as ins from "./text/ins";
import * as lab from "./text/lab";
import * as league from "./text/league";
import * as link from "./text/link";
import * as lvl from "./text/lvl";
import * as map from "./text/map";
import * as mom from "./text/mom";
import * as msg from "./text/msg";
import * as msgKind from "./text/msgKind";
import * as muscle from "./text/muscle";
import * as nav from "./text/nav";
import * as note from "./text/note";
import * as notes from "./text/notes";
import * as orm from "./text/orm";
import * as part from "./text/part";
import * as past from "./text/past";
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
import * as stats from "./text/stats";
import * as str from "./text/str";
import * as tab from "./text/tab";
import * as td from "./text/td";
import * as tdee from "./text/tdee";
import * as theme from "./text/theme";
import * as tier from "./text/tier";
import * as time from "./text/time";
import * as today from "./text/today";
import * as ton from "./text/ton";
import * as tools from "./text/tools";
import * as train from "./text/train";
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

export const en = {
  ...a11y.en,
  ...account.en,
  ...ach.en,
  ...activity.en,
  ...advice.en,
  ...appearance.en,
  ...awards.en,
  ...band.en,
  ...block.en,
  ...bmi.en,
  ...body.en,
  ...buddy.en,
  ...buy.en,
  ...cal.en,
  ...card.en,
  ...callText.en,
  ...category.en,
  ...cause.en,
  ...coach.en,
  ...conn.en,
  ...cos.en,
  ...count.en,
  ...creator.en,
  ...cycle.en,
  ...dash.en,
  ...delight.en,
  ...demo.en,
  ...done.en,
  ...dots.en,
  ...equipment.en,
  ...ex.en,
  ...exp.en,
  ...explain.en,
  ...extra.en,
  ...fb.en,
  ...fit.en,
  ...fix.en,
  ...fmt.en,
  ...friends.en,
  ...game.en,
  ...ghost.en,
  ...gl.en,
  ...gloss.en,
  ...goal.en,
  ...gym.en,
  ...hr.en,
  ...imp.en,
  ...info.en,
  ...inj.en,
  ...ins.en,
  ...lab.en,
  ...league.en,
  ...link.en,
  ...lvl.en,
  ...map.en,
  ...mom.en,
  ...msg.en,
  ...msgKind.en,
  ...muscle.en,
  ...nav.en,
  ...note.en,
  ...notes.en,
  ...orm.en,
  ...part.en,
  ...past.en,
  ...pgm.en,
  ...photos.en,
  ...plate.en,
  ...pm.en,
  ...pol.en,
  ...pr.en,
  ...pro.en,
  ...prog.en,
  ...progress.en,
  ...pub.en,
  ...push.en,
  ...quest.en,
  ...quote.en,
  ...rarity.en,
  ...recap.en,
  ...recovery.en,
  ...remix.en,
  ...rmd.en,
  ...rt.en,
  ...save.en,
  ...sband.en,
  ...sea.en,
  ...settings.en,
  ...setup.en,
  ...share.en,
  ...sig.en,
  ...str.en,
  ...stats.en,
  ...tab.en,
  ...td.en,
  ...tdee.en,
  ...theme.en,
  ...tier.en,
  ...time.en,
  ...today.en,
  ...ton.en,
  ...tools.en,
  ...train.en,
  ...trn.en,
  ...twin.en,
  ...units.en,
  ...variety.en,
  ...vc.en,
  ...vl.en,
  ...warm.en,
  ...wdg.en,
  ...why.en,
  ...wk.en,
  ...workout.en,
  ...x.en,
} as const;

export type MessageKey = keyof typeof en;
