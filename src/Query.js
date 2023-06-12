import { Autocomplete, Grid, Paper, TextField } from '@mui/material';
import React from 'react';


const Query = () => {

    const [categories, setCategories] = React.useState([])
    const [categoryMap, setCategoryMap] = React.useState()

    const [selectedCategory, setSelected] = React.useState()

    React.useEffect(() => {
        async function fetchCategories() {
            const options = {
                method: 'POST',
                body: JSON.stringify({
                    "quadValue": "<https://schema.org/category>"
                })
            }
            let response = await fetch("http://localhost:8080/query/predicate", options)
            let data = await response.json()

            let map = new Map()
            for (let r of data.results) {
                let c = r.o.replace("^^String", "")
                if (!map.has(c)) {
                    map.set(c, [])
                }
                map.get(c).push(r.s)
            }
            setCategories(Array.from(map.keys()))
            setCategoryMap(map)
        }

        let ignore = false;
        fetchCategories();
        return () => {
            ignore = true;
        }
    }, [])

    return (
        <>
            <div className='App-title'>
                Query Segments
            </div>
            <div className="App-content">
                <Autocomplete
                    disablePortal
                    options={categories}
                    sx={{ width: 300 }}
                    onChange={(e, v) => setSelected(v)}
                    renderInput={(params) => <TextField {...params} label="Category" />}
                />
                {selectedCategory &&
                    <Grid
                        container
                        maxWidth={'60vw'}
                        justifyContent='center'
                        alignItems='center'
                        spacing={2}
                        mt={2}
                    >
                        {categoryMap.get(selectedCategory).map((s, i) => (
                            <Grid item xs={2}>
                                <Paper elevation={3} sx={{ height: '16vh' }}>
                                    <img
                                        src={s.replace("<", "").replace(">", "")}
                                        key={i}
                                        height='100%' width='100%' style={{ objectFit: 'scale-down' }}
                                    />
                                </Paper>
                            </Grid>
                        ))
                        }
                    </Grid>
                }
            </div>
        </>
    )
}

export default Query;