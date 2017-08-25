import React       from "react"
import PropTypes   from "prop-types"
import moment      from "moment"
import { getPath } from "../../lib"
import Grid        from "./Grid"
import ValueRange  from "./ValueRange"
import Time        from "./Time"
import Period      from "./Period"
import Date        from "./Date"

export default class Observations extends React.Component
{
    static propTypes = {
        resources: PropTypes.arrayOf(PropTypes.object)
    };

    getObservationLabel(o) {
        return (
            getPath(o, "code.coding.0.display") ||
            getPath(o, "code.text") ||
            getPath(o, "valueQuantity.code")
        );
    }

    renderObservation(o, includeLabel = false) {
        if (Array.isArray(o.component)) {
            return o.component.map((c, i) => {
                let result = this.renderObservation(c, true);
                return (
                    <span key={i}>
                        { i > 0 && <span>,&nbsp;</span> }
                        {result}
                    </span>
                );
            });
        }

        const returnResult = result => {
            return (
                <span>
                    {includeLabel && <label className="text-muted">{this.getObservationLabel(o)}:&nbsp;</label>}
                    {result}
                </span>
            );
        };

        // valueBoolean
        if (o.hasOwnProperty("valueBoolean")) {
            return returnResult(
                !o.valueBoolean || o.valueBoolean == "false" ?
                "Negative" :
                "Positive"
            );
        }

        // valueString
        if (o.hasOwnProperty("valueString")) {
            return returnResult(String(o.valueString));
        }

        // valueRange
        if (o.hasOwnProperty("valueRange")) {
            return returnResult(<ValueRange range={o.valueRange}/>)
        }

        // valueTime
        if (o.hasOwnProperty("valueTime")) {
            return returnResult(<Time moment={o.valueTime}/>)
        }

        // valueDateTime
        if (o.hasOwnProperty("valueDateTime")) {
            return returnResult(<Date moment={o.valueDateTime}/>)
        }

        // valuePeriod
        if (o.hasOwnProperty("valuePeriod")) {
            return returnResult(Period(o.valuePeriod));
        }

        // valueCodeableConcept
        if (o.hasOwnProperty("valueCodeableConcept")) {
            return returnResult(getPath(o, "valueCodeableConcept.coding.0.display"));
        }

        // valueQuantity
        if (o.hasOwnProperty("valueQuantity")) {
            let value = getPath(o, "valueQuantity.value");
            let units = getPath(o, "valueQuantity.unit");

            if (getPath(o, "code.coding.0.code") == "55284-4" &&
                getPath(o, "code.coding.0.system") == "http://loinc.org") {
                return this.renderBloodPressure(o)
            }

            if (!isNaN(parseFloat(value))) {
                value = Math.round(value * 100) / 100;
            }

            return returnResult(
                <span>{value} <span className="text-muted">{units}</span></span>
            );
        }

        /* TODO:
        valueRatio      : Ratio
        valueSampledData: SampledData
        valueAttachment : Attachment
        */

        return returnResult(<span className="text-muted">N/A</span>)
    }

    renderBloodPressure(resource) {
        let component = resource.component || [resource]
        let out = []
        component.forEach(o => {
            let value = getPath(o, "valueQuantity.value")
            let units = getPath(o, "valueQuantity.unit")
            if (units && (value || value === 0)) {
                out.push(
                    getPath(o, "code.coding.0.display") + ": " +
                    value + " " + units
                )
            }
        });

        return out.join(", ")
    }

    render()
    {
        return (
            <Grid
                rows={ (this.props.resources || []).map(o => o.resource) }
                title="Observations"
                groupBy="Name"
                comparator={(a,b) => {
                    let dA = getPath(a, "effectiveDateTime");
                    let dB = getPath(b, "effectiveDateTime");
                    dA = dA ? +moment(dA) : 0;
                    dB = dB ? +moment(dB) : 0;
                    return dB - dA;
                }}
                cols={[
                    {
                        name  : "Name",
                        label : <b><i className="fa fa-flask"/> Name</b>,
                        path  : o => this.getObservationLabel(o),
                        render: o => <b>{this.getObservationLabel(o)}</b>
                    },
                    {
                        label : <b><i className="fa fa-flask"/> Value</b>,
                        render: o => this.renderObservation(o)
                    },
                    {
                        label: <b><i className="glyphicon glyphicon-time"/> Date</b>,
                        render: o => {
                            let date  = getPath(o, "effectiveDateTime");
                            if (date) date = moment(date).format("MM/DD/YYYY");
                            return <div className="text-muted">{ date || "-" }</div>
                        }
                    }
                ]}
            />
        )
    }
}
